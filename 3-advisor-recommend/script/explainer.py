"""
Generador de explicaciones RAG usando Bedrock Nova Lite.

Recibe la idea del estudiante y la evidencia de los asesores recomendados,
construye el prompt con contexto, y retorna explicaciones estructuradas.
"""

import json
import os
import boto3
from botocore.config import Config as BotoConfig
from config import AWS_REGION, AWS_PROFILE, LLM_MODEL


PROMPT_PATH = os.path.join(os.path.dirname(__file__), "..", "prompts", "recommendation.txt")


def _get_bedrock_client():
    """Crea cliente de Bedrock Runtime."""
    session = boto3.Session(profile_name=AWS_PROFILE, region_name=AWS_REGION)
    return session.client(
        "bedrock-runtime",
        config=BotoConfig(retries={"max_attempts": 3, "mode": "adaptive"}),
    )


def _load_system_prompt():
    """Lee el prompt de sistema desde el archivo template."""
    with open(PROMPT_PATH, "r", encoding="utf-8") as f:
        return f.read().strip()


def _build_user_message(thesis_idea, recommendations):
    """
    Construye el mensaje del usuario con la idea y la evidencia.

    Cada asesor se numera con su rank para que el LLM
    pueda referenciarlo sin necesidad de reproducir IDs hash.
    """
    parts = [f"Idea de tesis del estudiante:\n\"{thesis_idea}\"\n"]
    parts.append("Asesores recomendados con evidencia:\n")

    for i, rec in enumerate(recommendations, 1):
        parts.append(f"\nRank {i}: {rec['advisor_name']} (score: {rec['score']})")
        if rec.get("orcid"):
            parts.append(f"   ORCID: {rec['orcid']}")
        parts.append(f"   Tesis dirigidas: {rec.get('thesis_count', 'N/A')}")
        parts.append("   Evidencia relevante:")

        for ev in rec.get("evidence", []):
            label = ev["content_type"].upper()
            year_str = f" ({ev['year']})" if ev.get("year") else ""
            parts.append(f"   - [{label}{year_str}] {ev['content_text']}")

    return "\n".join(parts)


def generate_explanations(thesis_idea, recommendations):
    """
    Genera explicaciones RAG para los asesores recomendados.

    Envia el contexto (idea + evidencia) al LLM (Nova Lite)
    y retorna un dict con las explicaciones por advisor_id.

    El LLM responde con rank (1, 2, 3...) en lugar de advisor_id.
    Se mapea rank -> advisor_id usando el orden de recommendations.

    Args:
        thesis_idea: texto libre del estudiante
        recommendations: lista de dicts con advisor_id, advisor_name, evidence

    Returns:
        dict { advisor_id: explanation_text }
    """
    client = _get_bedrock_client()
    system_prompt = _load_system_prompt()
    user_message = _build_user_message(thesis_idea, recommendations)

    payload = json.dumps({
        "messages": [
            {"role": "user", "content": [{"text": user_message}]},
        ],
        "system": [{"text": system_prompt}],
        "inferenceConfig": {
            "maxTokens": 2048,
            "temperature": 0.3,
        },
    })

    response = client.invoke_model(
        modelId=LLM_MODEL,
        contentType="application/json",
        accept="application/json",
        body=payload,
    )

    body = json.loads(response["body"].read())
    raw_text = body["output"]["message"]["content"][0]["text"]

    # Parsea la respuesta JSON del LLM
    try:
        clean = raw_text.strip()
        if clean.startswith("```"):
            clean = clean.split("\n", 1)[1]
            clean = clean.rsplit("```", 1)[0]
        parsed = json.loads(clean)

        # Mapea rank -> advisor_id
        explanations = {}
        for item in parsed.get("explanations", []):
            rank = int(item["rank"])
            idx = rank - 1
            if 0 <= idx < len(recommendations):
                advisor_id = recommendations[idx]["advisor_id"]
                explanations[advisor_id] = item["explanation"]

        return explanations

    except (json.JSONDecodeError, KeyError, ValueError) as e:
        print(f"  WARN: no se pudo parsear respuesta del LLM: {e}")
        print(f"  Respuesta raw: {raw_text[:500]}")
        # Fallback: asigna el texto completo a todos
        return {rec["advisor_id"]: raw_text for rec in recommendations}
