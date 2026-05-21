"""
Router de evaluación offline: POST /evaluate

Ejecuta el evaluador offline contra el motor de recomendación actual.
No requiere feedback de usuarios. Usa métricas intrínsecas y opcionalmente
test de estabilidad con paráfrasis.

Endpoints:
    POST /evaluate          — evaluación completa (25 queries, ~2 min)
    POST /evaluate/quick    — evaluación rápida (5 queries)
    POST /evaluate/compare  — compara un query en v1 vs v2 (debug)
"""

import time

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.recommender import embed_idea, search_similar_chunks, rank_advisors
from app.services.evaluator import (
    EVALUATION_QUERIES,
    STABILITY_PAIRS,
    evaluate_single_query,
    evaluate_batch,
    ranking_stability_kendall,
    format_report,
)
from app.config import get_settings

settings = get_settings()
router = APIRouter(prefix="/evaluate", tags=["evaluation"])


class EvalRequest(BaseModel):
    num_queries: int | None = None   # None = todas
    top_k: int = 5
    knn_limit: int | None = None
    include_stability: bool = True
    include_detail: bool = False


class CompareRequest(BaseModel):
    query: str
    top_k: int = 5


def _run_recommendation(idea: str, top_k: int, knn_limit: int) -> list[dict]:
    """Ejecuta el pipeline de recomendación y retorna la lista de resultados."""
    embedding = embed_idea(idea)
    chunks = search_similar_chunks(embedding, limit=knn_limit)
    if not chunks:
        return []
    return rank_advisors(chunks, top_k=top_k)


@router.post("")
def run_evaluation(body: EvalRequest):
    """
    Evaluación completa del motor de recomendación.

    Ejecuta N queries predefinidas, calcula métricas intrínsecas,
    y opcionalmente test de estabilidad con paráfrasis.
    """
    queries = EVALUATION_QUERIES
    if body.num_queries and body.num_queries < len(queries):
        queries = queries[:body.num_queries]

    knn_limit = body.knn_limit or settings.knn_limit
    start = time.time()

    per_query_metrics = []
    per_query_detail = []

    for i, query in enumerate(queries):
        try:
            recs = _run_recommendation(query, body.top_k, knn_limit)
            metrics = evaluate_single_query(recs)
            metrics["query"] = query
            per_query_metrics.append(metrics)

            if body.include_detail:
                per_query_detail.append({
                    "query": query,
                    "metrics": metrics,
                    "top_3": [
                        {"name": r["advisor_name"], "score": r["score"]}
                        for r in recs[:3]
                    ],
                })
        except Exception as e:
            per_query_metrics.append({
                "query": query,
                "error": str(e),
                "top_score": 0, "score_separation": 0,
                "score_gap_top2": 0, "evidence_coverage": 0,
                "advisor_diversity": 0, "mean_score": 0,
                "mean_matching_chunks": 0,
            })

    # Stability test
    stability_results = None
    if body.include_stability:
        stability_results = []
        for original, paraphrase in STABILITY_PAIRS:
            try:
                recs_a = _run_recommendation(original, body.top_k, knn_limit)
                recs_b = _run_recommendation(paraphrase, body.top_k, knn_limit)
                ids_a = [r["advisor_id"] for r in recs_a]
                ids_b = [r["advisor_id"] for r in recs_b]
                stability_results.append((ids_a, ids_b))
            except Exception:
                pass

    batch_report = evaluate_batch(per_query_metrics, stability_results)
    batch_report["elapsed_seconds"] = round(time.time() - start, 2)

    result = {
        "summary": batch_report,
        "report_text": format_report(batch_report, per_query_metrics if body.include_detail else None),
    }

    if body.include_detail:
        result["per_query"] = per_query_detail

    return result


@router.post("/quick")
def run_quick_evaluation():
    """Evaluación rápida con 5 queries (para testing)."""
    return run_evaluation(EvalRequest(num_queries=5, include_stability=False))


@router.post("/compare")
def compare_single_query(body: CompareRequest):
    """
    Ejecuta una query y muestra el ranking detallado.
    Útil para debug y comparación manual.
    """
    start = time.time()

    try:
        recs = _run_recommendation(body.query, body.top_k, settings.knn_limit)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

    metrics = evaluate_single_query(recs)

    return {
        "query": body.query,
        "elapsed_seconds": round(time.time() - start, 2),
        "metrics": metrics,
        "recommendations": [
            {
                "rank": i + 1,
                "advisor_name": r["advisor_name"],
                "advisor_id": r["advisor_id"],
                "score": r["score"],
                "num_chunks": r.get("num_matching_chunks", 0),
                "evidence_types": list(set(
                    e["content_type"] for e in r.get("evidence", [])
                )),
                "top_evidence": r.get("evidence", [])[:3],
            }
            for i, r in enumerate(recs)
        ],
    }
