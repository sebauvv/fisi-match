"""
AWS Lambda handler para la evaluacion de alineamiento estudiante-tema (Fase 6).

Recibe los datos del estudiante directamente en el event, llama a Bedrock
y retorna el JSON estructurado del LLM. NO accede a la base de datos;
el guardado en alignment_reports lo realiza la API (backend).

Event esperado:
{
    "student_data": {
        "periodos_academicos": [...],   -- lista de periodos con cursos
        "cv_text": "...",               -- texto del CV (puede ser null)
        "thesis_idea": "..."            -- idea de tesis del estudiante
    }
}

Respuesta:
{
    "statusCode": 200,
    "body": "<JSON string con la evaluacion del LLM>"
}
"""

import json
import os
import boto3
from botocore.config import Config as BotoConfig

AWS_REGION  = os.getenv("AWS_REGION_", os.getenv("AWS_DEFAULT_REGION", "us-east-2"))
LLM_MODEL   = os.getenv("LLM_MODEL", "us.anthropic.claude-haiku-4-5-20251001-v1:0")
PROMPT_PATH = os.path.join(os.path.dirname(__file__), "prompts", "system_prompt.txt")


def _get_bedrock_client():
    session = boto3.Session(region_name=AWS_REGION)
    return session.client(
        "bedrock-runtime",
        config=BotoConfig(retries={"max_attempts": 3, "mode": "adaptive"}),
    )


def _load_system_prompt() -> str:
    with open(PROMPT_PATH, "r", encoding="utf-8") as f:
        return f.read().strip()


def _build_user_message(student_data: dict) -> str:
    periodos   = student_data.get("periodos_academicos") or []
    cv_text    = student_data.get("cv_text") or "No se proporcionó CV."
    thesis     = student_data.get("thesis_idea", "")
    return (
        f"IDEA DE TESIS:\n{thesis}\n\n"
        f"HISTORIAL ACADÉMICO (JSON):\n{json.dumps(periodos, ensure_ascii=False, indent=2)}\n\n"
        f"CV DEL ESTUDIANTE:\n{cv_text}"
    )


def _extract_json(text: str) -> dict:
    """Extrae JSON tolerando bloques markdown (```json ... ```)."""
    text = text.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        start = 1
        end = len(lines) - 1 if lines[-1].strip() == "```" else len(lines)
        text = "\n".join(lines[start:end]).strip()
    if not text:
        raise ValueError("El LLM devolvió una respuesta vacía.")
    return json.loads(text)


def _call_bedrock(bedrock_client, system_prompt: str, user_message: str) -> dict:
    response = bedrock_client.invoke_model(
        modelId=LLM_MODEL,
        contentType="application/json",
        accept="application/json",
        body=json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 8192,
            "system": system_prompt,
            "messages": [
                {"role": "user", "content": user_message}
            ],
        }),
    )
    raw  = json.loads(response["body"].read())
    text = raw["content"][0]["text"].strip()
    return _extract_json(text)


def lambda_handler(event, context):
    # Soporta invocacion directa y via API Gateway
    body = event
    if "body" in event:
        raw = event["body"]
        if isinstance(raw, bytes):
            raw = raw.decode("utf-8")
        if isinstance(raw, str):
            body = json.loads(raw)

    student_data = body.get("student_data")
    if not student_data:
        return {
            "statusCode": 400,
            "body": json.dumps(
                {"error": "Se requiere 'student_data' con periodos_academicos, cv_text y thesis_idea"},
                ensure_ascii=False,
            ),
        }

    if not student_data.get("thesis_idea"):
        return {
            "statusCode": 400,
            "body": json.dumps(
                {"error": "El campo 'thesis_idea' no puede estar vacío"},
                ensure_ascii=False,
            ),
        }

    system_prompt  = _load_system_prompt()
    user_message   = _build_user_message(student_data)
    bedrock_client = _get_bedrock_client()

    report = _call_bedrock(bedrock_client, system_prompt, user_message)

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json; charset=utf-8"},
        "body": json.dumps(report, ensure_ascii=False),
    }
