"""
Local script para generar recomendaciones de mejora (Fase 7).

Lee la evaluacion de alineamiento mas reciente del estudiante desde la DB,
llama a AWS Bedrock con un perfil SSO '', y muestra el JSON
con recomendaciones, temas alternativos y mini-proyectos.

Uso:
    python main.py --student-id <UUID> [--report-id <UUID>] [--output]
"""

import argparse
import json
import os
import sys
import psycopg2
import psycopg2.extras
import boto3
from botocore.config import Config as BotoConfig
from dotenv import load_dotenv

load_dotenv()

AWS_REGION  = os.getenv("AWS_REGION_", "us-east-2")
LLM_MODEL   = os.getenv("LLM_MODEL", "us.anthropic.claude-haiku-4-5-20251001-v1:0")
PROMPT_PATH = os.path.join(os.path.dirname(__file__), "..", "prompts", "system_prompt.txt")


# DB helpers
def get_db_conn():
    url = os.getenv("DATABASE_URL")
    if url:
        return psycopg2.connect(url)
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "5432")),
        dbname=os.getenv("DB_NAME", "advisors_db"),
        user=os.getenv("DB_USER", "advisor_user"),
        password=os.getenv("DB_PASSWORD", ""),
    )


def fetch_alignment_report(conn, student_id: str, report_id: str = None) -> dict:
    """Obtiene la evaluacion de alineamiento. Si no se indica report_id trae la mas reciente."""
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        if report_id:
            cur.execute(
                "SELECT * FROM alignment_reports WHERE id = %s AND student_id = %s",
                (report_id, student_id),
            )
        else:
            cur.execute(
                """
                SELECT * FROM alignment_reports
                WHERE student_id = %s
                ORDER BY created_at DESC
                LIMIT 1
                """,
                (student_id,),
            )
        row = cur.fetchone()
    if row is None:
        raise ValueError(
            f"No se encontró evaluacion de alineamiento para student_id={student_id!r}"
            + (f", report_id={report_id!r}" if report_id else " (ninguna registrada)")
        )
    return dict(row)


# Bedrock helpers
def get_bedrock_client():
    session = boto3.Session(profile_name="Ecomm-Seba", region_name=AWS_REGION)
    return session.client(
        "bedrock-runtime",
        config=BotoConfig(retries={"max_attempts": 3, "mode": "adaptive"}),
    )


def load_system_prompt() -> str:
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


def call_bedrock(bedrock_client, system_prompt: str, report_json: dict) -> dict:
    user_message = (
        "A continuación se muestra la evaluación de alineamiento del estudiante en formato JSON. "
        "Genera las recomendaciones correspondientes según las instrucciones.\n\n"
        f"{json.dumps(report_json, ensure_ascii=False, indent=2)}"
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


# Main
def main():
    parser = argparse.ArgumentParser(
        description="Generador de recomendaciones alternativas (Fase 7)"
    )
    parser.add_argument("--student-id", required=True, help="UUID del estudiante en la DB")
    parser.add_argument("--report-id", help="UUID del alignment_report a usar (default: el más reciente)")
    parser.add_argument("--output", action="store_true", help="Guarda el JSON en /output/")
    args = parser.parse_args()

    conn = get_db_conn()
    try:
        alignment = fetch_alignment_report(conn, args.student_id, args.report_id)
    except ValueError as e:
        print(str(e), file=sys.stderr)
        conn.close()
        sys.exit(1)
    conn.close()

    print(f"Evaluacion encontrada — Nivel: {alignment['alignment_level']} | Score: {alignment['score_pct']}%")
    print("Llamando a Bedrock para generar recomendaciones...\n")

    report_json    = alignment.get("report_json") or {}
    system_prompt  = load_system_prompt()
    bedrock_client = get_bedrock_client()

    recommendations = call_bedrock(bedrock_client, system_prompt, report_json)

    if args.output:
        os.makedirs(os.path.join(os.path.dirname(__file__), "output"), exist_ok=True)
        path = os.path.join(
            os.path.dirname(__file__), "output",
            f"recommendations_{args.student_id[:8]}.json"
        )
        with open(path, "w", encoding="utf-8") as f:
            json.dump(recommendations, f, ensure_ascii=False, indent=2)
        print(f"JSON guardado en: {path}")
    else:
        print(json.dumps(recommendations, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
