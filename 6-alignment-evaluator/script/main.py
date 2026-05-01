"""
Local script para evaluar el alineamiento estudiante-tema (Fase 6).

Lee los datos del estudiante desde la base de datos local (Docker),
construye el prompt con el perfil completo, llama a AWS Bedrock con
el perfil SSO 'Ecomm-Seba', y muestra el resultado JSON.

Con --save guarda la evaluacion en la tabla alignment_reports.

Uso:
    python main.py --student-id <UUID> [--save] [--output]
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
    """Establece conexion con la DB local (Docker) via .env."""
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


def fetch_student(conn, student_id: str) -> dict:
    """Obtiene datos del estudiante necesarios para la evaluacion."""
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            """
            SELECT id, nombres_apellidos, periodos_academicos, cv_text, thesis_idea
            FROM students
            WHERE id = %s
            """,
            (student_id,),
        )
        row = cur.fetchone()
    if row is None:
        raise ValueError(f"Estudiante con id {student_id!r} no encontrado.")
    return dict(row)


def save_report(conn, student_id: str, thesis_idea: str, report: dict):
    """Inserta una evaluacion en alignment_reports."""
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO alignment_reports
              (student_id, thesis_idea, alignment_level, score_pct,
               topic_requirements, student_profile_summary, justification,
               student_strengths, skill_gaps, report_json)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
            """,
            (
                student_id,
                thesis_idea,
                report["alignment_level"],
                report["score_pct"],
                report.get("topic_requirements"),
                report.get("student_profile_summary"),
                report["justification"],
                json.dumps(report.get("student_strengths", []), ensure_ascii=False),
                json.dumps(report.get("skill_gaps", []), ensure_ascii=False),
                json.dumps(report, ensure_ascii=False),
            ),
        )
        report_id = cur.fetchone()[0]
    conn.commit()
    return str(report_id)

# Bedrock helpers

def get_bedrock_client():
    """Crea cliente Bedrock Runtime usando el perfil SSO local."""
    session = boto3.Session(profile_name="Ecomm-Seba", region_name=AWS_REGION)
    return session.client(
        "bedrock-runtime",
        config=BotoConfig(retries={"max_attempts": 3, "mode": "adaptive"}),
    )


def load_system_prompt() -> str:
    with open(PROMPT_PATH, "r", encoding="utf-8") as f:
        return f.read().strip()


def build_user_message(student: dict) -> str:
    """Construye el mensaje de usuario con los datos del estudiante."""
    periodos = student.get("periodos_academicos") or []
    cv_text   = student.get("cv_text") or "No se proporcionó CV."
    thesis    = student.get("thesis_idea") or ""

    return (
        f"IDEA DE TESIS:\n{thesis}\n\n"
        f"HISTORIAL ACADÉMICO (JSON):\n{json.dumps(periodos, ensure_ascii=False, indent=2)}\n\n"
        f"CV DEL ESTUDIANTE:\n{cv_text}"
    )


def _extract_json(text: str) -> dict:
    """Extrae JSON de la respuesta del LLM, tolerando bloques de código markdown."""
    text = text.strip()
    # Quitar fences de código (```json ... ``` o ``` ... ```)
    if text.startswith("```"):
        lines = text.splitlines()
        # Eliminar primera y última línea con ```
        start = 1
        end = len(lines) - 1 if lines[-1].strip() == "```" else len(lines)
        text = "\n".join(lines[start:end]).strip()
    if not text:
        raise ValueError("El LLM devolvió una respuesta vacía.")
    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        raise ValueError(f"El LLM no devolvió JSON válido.\nRaw (primeros 500 chars): {text[:500]}") from e


def call_bedrock(bedrock_client, system_prompt: str, user_message: str) -> dict:
    """Llama a Claude Haiku 4.5 via Bedrock Messages API y parsea el JSON."""
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
    raw = json.loads(response["body"].read())
    text = raw["content"][0]["text"].strip()
    return _extract_json(text)


# Main

def main():
    parser = argparse.ArgumentParser(
        description="Evaluador de alineamiento estudiante-tema (Fase 6)"
    )
    parser.add_argument("--student-id", required=True, help="UUID del estudiante en la DB")
    parser.add_argument("--save", action="store_true", help="Guarda el resultado en alignment_reports")
    parser.add_argument("--output", action="store_true", help="Guarda el JSON en /output/")
    args = parser.parse_args()

    conn = get_db_conn()
    try:
        student = fetch_student(conn, args.student_id)
    except ValueError as e:
        print(str(e), file=sys.stderr)
        conn.close()
        sys.exit(1)

    if not student.get("thesis_idea"):
        print("ERROR: El estudiante no tiene una idea de tesis registrada.", file=sys.stderr)
        conn.close()
        sys.exit(1)

    print(f"Estudiante: {student['nombres_apellidos']}")
    print(f"Tesis: {student['thesis_idea'][:80]}...")
    print("Llamando a Bedrock...\n")

    system_prompt  = load_system_prompt()
    user_message   = build_user_message(student)
    bedrock_client = get_bedrock_client()

    report = call_bedrock(bedrock_client, system_prompt, user_message)

    if args.save:
        report_id = save_report(conn, args.student_id, student["thesis_idea"], report)
        print(f"Evaluacion guardada. ID: {report_id}\n")

    conn.close()

    if args.output:
        os.makedirs(os.path.join(os.path.dirname(__file__), "output"), exist_ok=True)
        path = os.path.join(os.path.dirname(__file__), "output", f"alignment_{args.student_id[:8]}.json")
        with open(path, "w", encoding="utf-8") as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        print(f"JSON guardado en: {path}")
    else:
        print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
