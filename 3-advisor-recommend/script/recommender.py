"""
Motor de scoring y ranking de asesores.

Implementa la formula de recomendacion:

    chunk_score(q, c) = cosine_sim(q, c) * temporal_weight(c.year)

    temporal_weight(year) = 1.0 + RECENCY_BOOST * ((year - MIN_YEAR) / (MAX_YEAR - MIN_YEAR))
        Si year es null, temporal_weight = 1.0

    advisor_score = mean(top_K_chunk_scores)

La combinacion lineal premia publicaciones recientes sin penalizar
las antiguas (piso 1.0). RECENCY_BOOST = 0.3 otorga hasta 30% de ventaja
al material mas actual.
"""

from collections import defaultdict
from config import RECENCY_BOOST, MIN_YEAR, MAX_YEAR, CHUNKS_PER_ADVISOR, TOP_K


def temporal_weight(year):
    """
    Calcula el peso temporal de un chunk.

    Publicaciones recientes reciben un boost proporcional;
    chunks sin año (perfiles) no reciben penalizacion.
    """
    if year is None:
        return 1.0
    normalized = (year - MIN_YEAR) / max(MAX_YEAR - MIN_YEAR, 1)
    normalized = max(0.0, min(1.0, normalized))
    return 1.0 + RECENCY_BOOST * normalized


def score_chunk(chunk):
    """
    Aplica la formula de scoring a un chunk individual.

    chunk debe contener 'similarity' (float) y 'year' (int o None).
    """
    sim = float(chunk["similarity"])
    weight = temporal_weight(chunk.get("year"))
    return sim * weight


def rank_advisors(chunks, top_k=None, chunks_per_advisor=None):
    """
    Agrupa chunks por asesor, calcula el score de cada uno y retorna
    los top-K asesores ordenados por score.

    Para cada asesor se toman los mejores M chunks (CHUNKS_PER_ADVISOR)
    y se promedian sus scores ponderados. Esto evita que asesores con
    muchas publicaciones tengan ventaja por volumen.

    Args:
        chunks: resultado de search_similar_chunks (lista de dicts)
        top_k: cantidad de asesores a retornar
        chunks_per_advisor: cantidad maxima de chunks por asesor para el promedio

    Returns:
        lista de dicts ordenada: advisor_id, advisor_name, score, evidence
    """
    if top_k is None:
        top_k = TOP_K
    if chunks_per_advisor is None:
        chunks_per_advisor = CHUNKS_PER_ADVISOR

    # Agrupa chunks por advisor_id
    by_advisor = defaultdict(list)
    for chunk in chunks:
        scored = {
            **chunk,
            "chunk_score": score_chunk(chunk),
        }
        by_advisor[chunk["advisor_id"]].append(scored)

    # Calcula score por asesor (promedio de top-M chunks)
    advisor_scores = []
    for advisor_id, advisor_chunks in by_advisor.items():
        sorted_chunks = sorted(advisor_chunks, key=lambda c: c["chunk_score"], reverse=True)
        top_chunks = sorted_chunks[:chunks_per_advisor]

        avg_score = sum(c["chunk_score"] for c in top_chunks) / len(top_chunks)

        evidence = []
        for c in top_chunks:
            evidence.append({
                "content_type": c["content_type"],
                "content_text": c["content_text"],
                "similarity": round(float(c["similarity"]), 4),
                "chunk_score": round(c["chunk_score"], 4),
                "year": c.get("year"),
                "source_id": c.get("source_id"),
            })

        advisor_scores.append({
            "advisor_id": advisor_id,
            "advisor_name": advisor_chunks[0].get("advisor_name", ""),
            "orcid": advisor_chunks[0].get("orcid"),
            "thesis_count": advisor_chunks[0].get("thesis_count"),
            "score": round(avg_score, 4),
            "num_matching_chunks": len(advisor_chunks),
            "evidence": evidence,
        })

    # Ordena por score descendente
    advisor_scores.sort(key=lambda a: a["score"], reverse=True)
    return advisor_scores[:top_k]
