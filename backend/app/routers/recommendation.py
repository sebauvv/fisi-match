"""
Router de recomendaciones: POST /recommendations

Flujo:
  1. Backend embebe la idea (Bedrock Titan v2)
  2. Backend ejecuta kNN search en pgvector (cosine distance)
  3. Backend rankea asesores (scoring temporal)
  4. Backend invoca Lambda Fase 3 pasándole los resultados ya calculados
  5. Lambda solo genera las explicaciones RAG (Bedrock Nova Lite)
  6. Backend une explanations + recommendations y devuelve respuesta final

Formato de respuesta (sin cambios para el frontend):
{
    "query": "...",
    "top_k": 5,
    "knn_limit": 50,
    "elapsed_seconds": 4.2,
    "recommendations": [
        {
            "rank": 1,
            "advisor_id": "...",
            "advisor_name": "...",
            "score": 0.87,
            "orcid": "...",
            "thesis_count": 12,
            "num_matching_chunks": 8,
            "explanation": "...",
            "matching_evidence": [...]
        }
    ]
}
"""

import json
import time

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.config import get_settings
from app.services.aws import get_advisor_lambda_client
from app.services.recommender import embed_idea, search_similar_chunks, rank_advisors

settings = get_settings()

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


class RecommendationRequest(BaseModel):
    query: str
    top_k: int = None
    knn_limit: int = None
    no_explain: bool = False


@router.post("")
def generate_recommendation(body: RecommendationRequest):
    """
    Genera recomendaciones de asesores para una idea de tesis.

    El backend realiza embedding + kNN + scoring, luego invoca al Lambda
    de Fase 3 solo para generar las explicaciones RAG.
    """
    idea = body.query.strip()
    if not idea:
        raise HTTPException(status_code=400, detail="El campo 'query' no puede estar vacío")

    top_k = body.top_k or settings.top_k
    knn_limit = body.knn_limit or settings.knn_limit

    start = time.time()

    # 1. Embedding
    try:
        query_embedding = embed_idea(idea)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Error al generar embedding: {exc}")

    # 2. kNN Search en pgvector
    try:
        chunks = search_similar_chunks(query_embedding, limit=knn_limit)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Error en búsqueda kNN: {exc}")

    if not chunks:
        return {
            "query": idea,
            "top_k": top_k,
            "knn_limit": knn_limit,
            "elapsed_seconds": round(time.time() - start, 2),
            "recommendations": [],
        }

    # 3. Scoring y Ranking
    recommendations = rank_advisors(chunks, top_k=top_k)

    # 4. Invocación Lambda (solo RAG)
    explanations = {}
    if not body.no_explain:
        lambda_payload = json.dumps(
            {
                "thesis_idea": idea,
                "recommendations": recommendations,
                "no_explain": False,
            },
            ensure_ascii=False,
        )

        try:
            lambda_client = get_advisor_lambda_client()
            response = lambda_client.invoke(
                FunctionName=settings.advisor_lambda_function,
                InvocationType="RequestResponse",
                Payload=lambda_payload.encode("utf-8"),
            )
        except Exception as exc:
            raise HTTPException(status_code=502, detail=f"Error al invocar Lambda: {exc}")

        if response.get("FunctionError"):
            raw = response["Payload"].read().decode("utf-8")
            raise HTTPException(status_code=502, detail=f"Lambda retornó un error: {raw}")

        raw_payload = response["Payload"].read().decode("utf-8")
        try:
            outer = json.loads(raw_payload)
        except json.JSONDecodeError:
            raise HTTPException(status_code=502, detail="Respuesta de Lambda no es JSON válido")

        # Lambda devuelve {"statusCode": 200, "body": "{...}"}
        body_content = outer.get("body", outer)
        if isinstance(body_content, str):
            try:
                body_content = json.loads(body_content)
            except json.JSONDecodeError:
                body_content = {}

        explanations = body_content.get("explanations", {})

    # 5. Resultados
    result = {
        "query": idea,
        "top_k": top_k,
        "knn_limit": knn_limit,
        "elapsed_seconds": round(time.time() - start, 2),
        "recommendations": [],
    }

    for i, rec in enumerate(recommendations, 1):
        result["recommendations"].append({
            "rank": i,
            "advisor_id": rec["advisor_id"],
            "advisor_name": rec["advisor_name"],
            "score": rec["score"],
            "orcid": rec.get("orcid"),
            "thesis_count": rec.get("thesis_count"),
            "num_matching_chunks": rec.get("num_matching_chunks", 0),
            "explanation": explanations.get(rec["advisor_id"], ""),
            "matching_evidence": rec.get("evidence", []),
        })

    return result
