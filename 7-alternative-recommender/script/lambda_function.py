"""
AWS Lambda handler para la generacion de recomendaciones alternativas (Fase 7).

Recibe el JSON de una evaluacion de alineamiento (output de la Fase 6),
llama a Bedrock y retorna el JSON de recomendaciones. NO accede a la DB;
la API se encarga de obtener el alignment_report y pasar los datos.

Event esperado:
{
    "alignment_report": {
        "alignment_level": "Alta|Media|Baja",
        "score_pct": 75,
        "topic_requirements": "...",
        "student_profile_summary": "...",
        "justification": "...",
        "student_strengths": [...],
        "skill_gaps": [...],
        "relevant_courses": [...],
        "relevant_cv_skills": [...]
    }
}

Respuesta:
{
    "statusCode": 200,
    "body": "<JSON string con las recomendaciones del LLM>"
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


def _call_bedrock(bedrock_client, system_prompt: str, alignment_report: dict) -> dict:
    user_message = (
        "A continuación se muestra la evaluación de alineamiento del estudiante en formato JSON. "
        "Genera las recomendaciones correspondientes según las instrucciones.\n\n"
        f"{json.dumps(alignment_report, ensure_ascii=False, indent=2)}"
    )
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

    alignment_report = body.get("alignment_report")
    if not alignment_report:
        return {
            "statusCode": 400,
            "body": json.dumps(
                {"error": "Se requiere 'alignment_report' con la evaluacion de alineamiento de la Fase 6"},
                ensure_ascii=False,
            ),
        }

    system_prompt  = _load_system_prompt()
    bedrock_client = _get_bedrock_client()

    recommendations = _call_bedrock(bedrock_client, system_prompt, alignment_report)

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json; charset=utf-8"},
        "body": json.dumps(recommendations, ensure_ascii=False),
    }
