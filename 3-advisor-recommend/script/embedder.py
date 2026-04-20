"""
Cliente de Bedrock para generar embeddings de la idea del estudiante.

Usa el mismo modelo Titan v2 que Fase 2 para mantener
coherencia en el espacio semantico.
"""

import json
import boto3
from botocore.config import Config as BotoConfig
from config import AWS_REGION, AWS_PROFILE, EMBEDDING_MODEL, EMBEDDING_DIMENSIONS, MODE


def _get_bedrock_client():
    """Crea cliente de Bedrock Runtime con el perfil SSO configurado."""
    if MODE == "cloud":
        session = boto3.Session(region_name=AWS_REGION)
    else:
        session = boto3.Session(profile_name=AWS_PROFILE, region_name=AWS_REGION)
    return session.client(
        "bedrock-runtime",
        config=BotoConfig(retries={"max_attempts": 3, "mode": "adaptive"}),
    )


def embed_text(text: str) -> list[float]:
    """
    Genera el embedding de un texto usando Bedrock Titan Embeddings v2.

    Args:
        text: la idea de tesis del estudiante

    Returns:
        vector de 1024 dimensiones
    """
    client = _get_bedrock_client()

    payload = json.dumps({
        "inputText": text,
        "dimensions": EMBEDDING_DIMENSIONS,
    })

    response = client.invoke_model(
        modelId=EMBEDDING_MODEL,
        contentType="application/json",
        accept="application/json",
        body=payload,
    )

    body = json.loads(response["body"].read())
    return body["embedding"]
