"""
AWS Lambda handler para el procesamiento de PDFs academicos.

Recibe S3 keys de los PDFs, los descarga a /tmp/, procesa con pdfplumber
(historial + matricula) y Bedrock Nova Lite (CV), y retorna JSON estructurado.

Event esperado (body JSON):
{
    "historial_key": "uploads/22200247/historial-academico.pdf",
    "matricula_key": "uploads/22200247/reporte_matricula.pdf",  (opcional)
    "cv_key": "uploads/22200247/cv.pdf"                         (opcional)
}
"""

import json
import os
import time
import boto3
from botocore.config import Config as BotoConfig

from parsers.historial_parser import parse_historial
from parsers.matricula_parser import parse_matricula
from parsers.cv_parser import parse_cv

AWS_REGION = os.getenv("AWS_REGION_", os.getenv("AWS_DEFAULT_REGION", "us-east-2"))
LLM_MODEL = os.getenv("LLM_MODEL", "us.amazon.nova-lite-v1:0")
S3_BUCKET = os.getenv("S3_BUCKET", "student-profile-pdfs-unmsm")
PROMPT_PATH = os.path.join(os.path.dirname(__file__), "prompts", "prompt.txt")


def _get_s3_client():
    """Crea cliente S3."""
    return boto3.client("s3", region_name=AWS_REGION)


def _get_bedrock_client():
    """Crea cliente Bedrock Runtime."""
    session = boto3.Session(region_name=AWS_REGION)
    return session.client(
        "bedrock-runtime",
        config=BotoConfig(retries={"max_attempts": 3, "mode": "adaptive"}),
    )


def _download_from_s3(s3_client, key: str) -> str:
    """Descarga un archivo de S3 a /tmp/ y retorna la ruta local."""
    filename = os.path.basename(key)
    local_path = f"/tmp/{filename}"
    s3_client.download_file(S3_BUCKET, key, local_path)
    return local_path


def _build_pdf_url(key: str) -> str:
    """Genera URL publica del PDF en S3."""
    return f"https://{S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{key}"


def _load_prompt() -> str:
    """Lee el prompt del sistema desde el archivo empaquetado."""
    with open(PROMPT_PATH, "r", encoding="utf-8") as f:
        return f.read().strip()


def lambda_handler(event, context):
    """
    Entry point de AWS Lambda.
    Procesa PDFs academicos y retorna perfil estructurado.
    """
    # Parsear body (puede venir de API Gateway o invocacion directa)
    body = event
    if "body" in event:
        raw_body = event["body"]
        if isinstance(raw_body, bytes):
            raw_body = raw_body.decode("utf-8")
        if isinstance(raw_body, str):
            body = json.loads(raw_body)

    historial_key = body.get("historial_key")
    matricula_key = body.get("matricula_key")
    cv_key = body.get("cv_key")

    if not historial_key:
        return {
            "statusCode": 400,
            "body": json.dumps(
                {"error": "Se requiere 'historial_key' con la ubicacion del PDF en S3"},
                ensure_ascii=False,
            ),
        }

    start = time.time()
    s3_client = _get_s3_client()
    result = {"pdf_urls": {}}

    # 1. Historial academico
    historial_path = _download_from_s3(s3_client, historial_key)
    perfil = parse_historial(historial_path)
    result["historial"] = perfil
    result["pdf_urls"]["historial"] = _build_pdf_url(historial_key)

    # 2. Reporte de matricula (opcional)
    if matricula_key:
        matricula_path = _download_from_s3(s3_client, matricula_key)
        matricula_data = parse_matricula(matricula_path)

        if matricula_data.get("cursos"):
            perfil["periodos_academicos"].append({
                "periodo": matricula_data["periodo"],
                "cursos": matricula_data["cursos"],
            })

        result["pdf_urls"]["matricula"] = _build_pdf_url(matricula_key)

    # 3. CV con LLM (opcional)
    if cv_key:
        cv_path = _download_from_s3(s3_client, cv_key)
        bedrock_client = _get_bedrock_client()
        prompt_text = _load_prompt()

        cv_result = parse_cv(
            cv_path,
            bedrock_client=bedrock_client,
            llm_model=LLM_MODEL,
            prompt_text=prompt_text,
        )
        result["cv"] = cv_result
        result["pdf_urls"]["cv"] = _build_pdf_url(cv_key)

    result["elapsed_seconds"] = round(time.time() - start, 2)

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json; charset=utf-8"},
        "body": json.dumps(result, ensure_ascii=False),
    }
