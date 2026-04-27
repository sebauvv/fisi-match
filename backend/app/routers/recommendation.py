"""Router de recomendaciones: POST /recommendations — invoca Lambda de IA."""

import json
import base64

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.config import get_settings
from app.services.aws import get_advisor_lambda_client

settings = get_settings()

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


class RecommendationRequest(BaseModel):
    query: str


@router.post("")
def generate_recommendation(body: RecommendationRequest):
    """Invoca el Lambda de recomendacion de asesor y retorna el resultado."""
    lambda_client = get_advisor_lambda_client()

    # El Lambda espera la clave "thesis_idea" en el payload
    payload = json.dumps({"thesis_idea": body.query}, ensure_ascii=False)

    try:
        response = lambda_client.invoke(
            FunctionName=settings.advisor_lambda_function,
            InvocationType="RequestResponse",
            Payload=payload.encode("utf-8"),
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Error al invocar Lambda: {exc}")

    # Read streaming body
    raw_payload = response["Payload"].read().decode("utf-8")

    # Check for Lambda-level errors (FunctionError)
    if response.get("FunctionError"):
        raise HTTPException(
            status_code=502,
            detail=f"Lambda retornó un error: {raw_payload}",
        )

    try:
        outer = json.loads(raw_payload)
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="Respuesta de Lambda no es JSON válido")

    # Lambda wraps result as {"statusCode": 200, "body": {...}}
    if isinstance(outer, dict) and "body" in outer:
        body_content = outer["body"]
        # body may be a string or already a dict
        if isinstance(body_content, str):
            try:
                return json.loads(body_content)
            except json.JSONDecodeError:
                return {"raw": body_content}
        return body_content

    # Direct response (local Lambda format without wrapping)
    return outer
