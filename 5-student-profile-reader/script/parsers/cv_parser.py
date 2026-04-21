"""
Procesamiento de CV con AWS Bedrock LLM (Nova Lite).

Extrae texto del PDF con pdfplumber y lo envia al LLM con un prompt
de sistema para obtener habilidades, experiencia y proyectos.
"""

import json
import pdfplumber


def _extract_text(pdf_path: str) -> str:
    """Extrae todo el texto plano de un PDF."""
    pages_text = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                pages_text.append(text)
    return "\n".join(pages_text)


def parse_cv(pdf_path: str, bedrock_client=None, llm_model: str = "", prompt_text: str = "") -> dict:
    """Procesa un CV en PDF usando un LLM (Bedrock Nova Lite).

    Args:
        pdf_path: ruta al PDF del CV.
        bedrock_client: cliente boto3 de bedrock-runtime (inyectado por Lambda).
        llm_model: ID del modelo (ej: us.amazon.nova-lite-v1:0).
        prompt_text: texto del prompt del sistema.

    Returns:
        dict con claves: cv_text (texto extraido del LLM).
    """
    if not bedrock_client:
        raise ValueError(
            "Se requiere un cliente de Bedrock. "
            "Este modulo se ejecuta desde Lambda, no en modo local."
        )

    cv_text = _extract_text(pdf_path)
    if not cv_text.strip():
        return {"cv_text": "No se pudo extraer texto del PDF del CV."}

    payload = json.dumps({
        "messages": [
            {"role": "user", "content": [{"text": cv_text}]},
        ],
        "system": [{"text": prompt_text}],
        "inferenceConfig": {
            "maxTokens": 2048,
            "temperature": 0.2,
        },
    })

    response = bedrock_client.invoke_model(
        modelId=llm_model,
        contentType="application/json",
        accept="application/json",
        body=payload,
    )

    body = json.loads(response["body"].read())
    raw_text = body["output"]["message"]["content"][0]["text"]

    # Limpia markdown si el LLM lo agrega
    clean = raw_text.strip()
    if clean.startswith("```"):
        clean = clean.split("\n", 1)[1]
        clean = clean.rsplit("```", 1)[0].strip()

    return {"cv_text": clean}
