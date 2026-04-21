"""
FastAPI de prueba para el procesamiento de PDFs academicos.

Sube los PDFs a S3 e invoca la Lambda StudentProfileReader.
Retorna el perfil estructurado del estudiante.

Uso:
    source .venv/bin/activate
    pip install -r requirements.txt
    uvicorn test:app --reload --port 8000

POST /process-profile
    Form-data:
        historial: archivo PDF (requerido)
        matricula: archivo PDF (opcional)
        cv: archivo PDF (opcional)
"""

import json
import os
import uuid

import boto3
from dotenv import load_dotenv
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse

load_dotenv()

app = FastAPI(title="Student Profile Reader API")

AWS_REGION = os.getenv("AWS_REGION", "us-east-2")
AWS_PROFILE = os.getenv("AWS_PROFILE", "Ecomm-Seba")
S3_BUCKET = os.getenv("S3_BUCKET", "student-profile-pdfs-unmsm")
LAMBDA_FUNCTION = os.getenv("LAMBDA_FUNCTION", "StudentProfileReader")
S3_ACCESS_KEY = os.getenv("S3_ACCESS_KEY_ID")
S3_SECRET_KEY = os.getenv("S3_SECRET_ACCESS_KEY")


def _get_s3_client():
    """Crea cliente S3 usando las credenciales del IAM user (de .env)."""
    if S3_ACCESS_KEY and S3_SECRET_KEY:
        return boto3.client(
            "s3",
            region_name=AWS_REGION,
            aws_access_key_id=S3_ACCESS_KEY,
            aws_secret_access_key=S3_SECRET_KEY,
        )
    # Fallback: usa un profile de SSO (no recomendado tbh)
    session = boto3.Session(profile_name=AWS_PROFILE, region_name=AWS_REGION)
    return session.client("s3")


def _get_lambda_client():
    """Crea cliente Lambda usando el profile de SSO."""
    session = boto3.Session(profile_name=AWS_PROFILE, region_name=AWS_REGION)
    return session.client("lambda")


async def _upload_to_s3(s3_client, file: UploadFile, prefix: str) -> str:
    """Sube un archivo a S3 y retorna la key."""
    content = await file.read()
    key = f"{prefix}/{file.filename}"
    s3_client.put_object(
        Bucket=S3_BUCKET,
        Key=key,
        Body=content,
        ContentType="application/pdf",
    )
    return key


def _clean_response(raw: str) -> dict:
    """Limpia la respuesta Lambda de caracteres escapados innecesarios."""
    if isinstance(raw, str):
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return {"raw": raw}
    return raw


@app.post("/process-profile")
async def process_profile(
    historial: UploadFile = File(..., description="PDF de historial academico"),
    matricula: UploadFile | None = File(None, description="PDF de reporte de matricula (opcional)"),
    cv: UploadFile | None = File(None, description="PDF del CV (opcional)"),
):
    """
    Recibe pdfs academicos, los sube a S3, invoca Lambda y retorna el perfil.
    """
    request_id = uuid.uuid4().hex[:8]
    prefix = f"uploads/{request_id}"

    s3_client = _get_s3_client()
    lambda_client = _get_lambda_client()

    # Sube pdfs a S3
    payload = {}

    historial_key = await _upload_to_s3(s3_client, historial, prefix)
    payload["historial_key"] = historial_key

    if matricula and matricula.filename:
        matricula_key = await _upload_to_s3(s3_client, matricula, prefix)
        payload["matricula_key"] = matricula_key

    if cv and cv.filename:
        cv_key = await _upload_to_s3(s3_client, cv, prefix)
        payload["cv_key"] = cv_key

    # Invoca Lambda
    response = lambda_client.invoke(
        FunctionName=LAMBDA_FUNCTION,
        InvocationType="RequestResponse",
        Payload=json.dumps(payload),
    )

    response_payload = json.loads(response["Payload"].read())

    # Extrae body del response Lambda
    status_code = response_payload.get("statusCode", 200)
    body_raw = response_payload.get("body", "{}")
    body = _clean_response(body_raw)

    return JSONResponse(content=body, status_code=status_code)
