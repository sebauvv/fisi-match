"""
FastAPI de prueba para el procesamiento de PDFs academicos.
Sube los PDFs a S3 e invoca la Lambda StudentProfileReader.
Retorna el perfil estructurado del estudiante y lo guarda en PostgreSQL.

Uso:
    source .venv/bin/activate
    pip install -r requirements.txt
    uvicorn test:app --reload --port 8000

POST /process-profile
    Form-data:
        historial:  archivo PDF (requerido)
        matricula:  archivo PDF (opcional)
        cv:         archivo PDF (opcional)
        email:      string     (requerido)
        password:   string     (requerido)
"""

import json
import os
import uuid
import bcrypt
import boto3
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

load_dotenv()

app = FastAPI(title="Student Profile Reader API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── AWS ──────────────────────────────────────────────────────────────────────
AWS_REGION       = os.getenv("AWS_REGION", "us-east-2")
AWS_PROFILE      = os.getenv("AWS_PROFILE", "Ecomm-Seba")
S3_BUCKET        = os.getenv("S3_BUCKET", "student-profile-pdfs-unmsm")
LAMBDA_FUNCTION  = os.getenv("LAMBDA_FUNCTION", "StudentProfileReader")
S3_ACCESS_KEY    = os.getenv("S3_ACCESS_KEY_ID")
S3_SECRET_KEY    = os.getenv("S3_SECRET_ACCESS_KEY")

# ── PostgreSQL ────────────────────────────────────────────────────────────────
DB_HOST     = os.getenv("DB_HOST", "localhost")
DB_PORT     = os.getenv("DB_PORT", "5432")
DB_NAME     = os.getenv("DB_NAME", "postgres")
DB_USER     = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")


# ── Helpers AWS ───────────────────────────────────────────────────────────────

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


# ── Helper DB ─────────────────────────────────────────────────────────────────

def _get_db_connection():
    """Retorna una conexión psycopg2 a PostgreSQL."""
    return psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
    )


def _save_student(body: dict, email: str, password: str) -> str:
    """
    Persiste el perfil del estudiante en la tabla students.
    Retorna el UUID generado.

    Lanza HTTPException 409 si el email o codigo_matricula ya existen.
    """
    # Hash de la contraseña con bcrypt
    password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    # Extrae secciones del JSON devuelto por Lambda
    pdf_urls   = body.get("pdf_urls", {})
    historial  = body.get("historial", {})
    estudiante = historial.get("estudiante", {})
    resumen    = historial.get("resumen_creditos", {})
    periodos   = historial.get("periodos_academicos", [])
    cv_text    = body.get("cv", {}).get("cv_text")

    student_id = str(uuid.uuid4())

    sql = """
        INSERT INTO students (
            id,
            email,
            password_hash,
            codigo_matricula,
            nombres_apellidos,
            facultad,
            escuela,
            plan,
            pdf_url_historial,
            pdf_url_matricula,
            pdf_url_cv,
            periodos_academicos,
            cv_text,
            creditaje_requerido_para_egresar,
            creditaje_aprobado,
            obligatorios,
            de_especialidad,
            electivos_generales,
            electivos_de_especialidad,
            optativos,
            alternativos,
            de_otra_especialidad,
            mas_de_una_vez,
            otros,
            creditaje_faltante,
            promedio_ponderado
        ) VALUES (
            %(id)s,
            %(email)s,
            %(password_hash)s,
            %(codigo_matricula)s,
            %(nombres_apellidos)s,
            %(facultad)s,
            %(escuela)s,
            %(plan)s,
            %(pdf_url_historial)s,
            %(pdf_url_matricula)s,
            %(pdf_url_cv)s,
            %(periodos_academicos)s,
            %(cv_text)s,
            %(creditaje_requerido_para_egresar)s,
            %(creditaje_aprobado)s,
            %(obligatorios)s,
            %(de_especialidad)s,
            %(electivos_generales)s,
            %(electivos_de_especialidad)s,
            %(optativos)s,
            %(alternativos)s,
            %(de_otra_especialidad)s,
            %(mas_de_una_vez)s,
            %(otros)s,
            %(creditaje_faltante)s,
            %(promedio_ponderado)s
        )
    """

    params = {
        "id":                               student_id,
        "email":                            email,
        "password_hash":                    password_hash,
        "codigo_matricula":                 estudiante.get("codigo_matricula"),
        "nombres_apellidos":                estudiante.get("nombres_apellidos"),
        "facultad":                         estudiante.get("facultad"),
        "escuela":                          estudiante.get("escuela"),
        "plan":                             estudiante.get("plan"),
        "pdf_url_historial":                pdf_urls.get("historial"),
        "pdf_url_matricula":                pdf_urls.get("matricula"),
        "pdf_url_cv":                       pdf_urls.get("cv"),
        # JSONB: psycopg2 necesita el JSON serializado como string con Json()
        "periodos_academicos":              psycopg2.extras.Json(periodos),
        "cv_text":                          cv_text,
        "creditaje_requerido_para_egresar": resumen.get("creditaje_requerido_para_egresar"),
        "creditaje_aprobado":               resumen.get("creditaje_aprobado"),
        "obligatorios":                     resumen.get("obligatorios"),
        "de_especialidad":                  resumen.get("de_especialidad"),
        "electivos_generales":              resumen.get("electivos_generales"),
        "electivos_de_especialidad":        resumen.get("electivos_de_especialidad"),
        "optativos":                        resumen.get("optativos"),
        "alternativos":                     resumen.get("alternativos"),
        "de_otra_especialidad":             resumen.get("de_otra_especialidad"),
        "mas_de_una_vez":                   resumen.get("mas_de_una_vez"),
        "otros":                            resumen.get("otros"),
        "creditaje_faltante":               resumen.get("creditaje_faltante"),
        "promedio_ponderado":               resumen.get("promedio_ponderado"),
    }

    conn = _get_db_connection()
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute(sql, params)
    except psycopg2.errors.UniqueViolation as e:
        # email o codigo_matricula duplicado
        detail = str(e).splitlines()[0]
        raise HTTPException(status_code=409, detail=f"Registro duplicado: {detail}")
    finally:
        conn.close()

    return student_id


# ── Endpoint ──────────────────────────────────────────────────────────────────

@app.post("/process-profile")
async def process_profile(
    email:    str        = Form(..., description="Correo del estudiante"),
    password: str        = Form(..., description="Contraseña del estudiante"),
    historial: UploadFile = File(..., description="PDF de historial academico"),
    matricula: UploadFile | None = File(None, description="PDF de reporte de matricula (opcional)"),
    cv:        UploadFile | None = File(None, description="PDF del CV (opcional)"),
):
    """
    1. Sube los PDFs a S3.
    2. Invoca la Lambda StudentProfileReader.
    3. Persiste el perfil en PostgreSQL (tabla students).
    4. Retorna el perfil estructurado + student_id generado.
    """
    request_id = uuid.uuid4().hex[:8]
    prefix     = f"uploads/{request_id}"

    s3_client     = _get_s3_client()
    lambda_client = _get_lambda_client()

    # ── Sube PDFs a S3 ───────────────────────────────────────────────────────
    payload: dict = {}

    historial_key = await _upload_to_s3(s3_client, historial, prefix)
    payload["historial_key"] = historial_key

    if matricula and matricula.filename:
        matricula_key = await _upload_to_s3(s3_client, matricula, prefix)
        payload["matricula_key"] = matricula_key

    if cv and cv.filename:
        cv_key = await _upload_to_s3(s3_client, cv, prefix)
        payload["cv_key"] = cv_key

    # ── Invoca Lambda ────────────────────────────────────────────────────────
    response = lambda_client.invoke(
        FunctionName=LAMBDA_FUNCTION,
        InvocationType="RequestResponse",
        Payload=json.dumps(payload),
    )
    response_payload = json.loads(response["Payload"].read())

    status_code = response_payload.get("statusCode", 200)
    body_raw    = response_payload.get("body", "{}")
    body        = _clean_response(body_raw)

    if status_code != 200:
        return JSONResponse(content=body, status_code=status_code)

    # ── Guarda en PostgreSQL ─────────────────────────────────────────────────
    student_id = _save_student(body, email, password)

    return JSONResponse(
        content={**body, "student_id": student_id},
        status_code=201,
    )