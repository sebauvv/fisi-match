"""
Motor de scoring y ranking de asesores (v2).

Formula de scoring:
    chunk_score = cosine_sim * temporal_weight(year) * content_type_weight(type)
    advisor_score = mean(top_M_chunk_scores) * coverage_boost(num_relevant)

Mejoras vs v1:
    - Content-type boosting: thesis (1.3) > publication (1.15) > profile (1.0)
    - Decaimiento temporal exponencial (ultimos 5 años pesan mas)
    - Filtro de similitud minima (MIN_SIMILARITY)
    - Coverage boost logaritmico (mas evidencia = mas confianza)
"""

import math
from collections import defaultdict
from config import (
    RECENCY_BOOST, MIN_YEAR, MAX_YEAR, TEMPORAL_DECAY_RATE,
    CHUNKS_PER_ADVISOR, TOP_K, CONTENT_TYPE_WEIGHTS,
    MIN_SIMILARITY, COVERAGE_ALPHA,
)


def temporal_weight(year):
    """
    Calcula el peso temporal usando decaimiento exponencial.

    Con DECAY_RATE=5:
      2026: +0.30, 2021: +0.16, 2016: +0.04, 2010: +0.01
    Chunks sin año (perfiles) retornan 1.0 (sin penalizacion).
    """
    if year is None:
        return 1.0
    age = max(MAX_YEAR - year, 0)
    return 1.0 + RECENCY_BOOST * math.exp(-age / TEMPORAL_DECAY_RATE)


def content_type_weight(content_type):
    """Retorna el peso multiplicativo segun el tipo de contenido."""
    return CONTENT_TYPE_WEIGHTS.get(content_type, 1.0)


def coverage_boost(num_relevant_chunks):
    """
    Boost multiplicativo por cantidad de evidencia relevante.
    Formula: 1 + alpha * log(n + 1)
    """
    return 1.0 + COVERAGE_ALPHA * math.log(num_relevant_chunks + 1)


def score_chunk(chunk):
    """
    Aplica la formula de scoring v2 a un chunk individual.

    chunk_score = cosine_sim * temporal_weight(year) * content_type_weight(type)
    """
    sim = float(chunk["similarity"])
    t_weight = temporal_weight(chunk.get("year"))
    ct_weight = content_type_weight(chunk.get("content_type", "profile"))
    return sim * t_weight * ct_weight


def rank_advisors(chunks, top_k=None, chunks_per_advisor=None):
    """
    Agrupa chunks por asesor, calcula el score de cada uno y retorna
    los top-K asesores ordenados por score.

    Filtra chunks por debajo de MIN_SIMILARITY, aplica scoring v2,
    y agrega coverage boost logaritmico.

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

    # Filtra chunks por debajo del umbral de similitud
    relevant_chunks = [
        c for c in chunks if float(c["similarity"]) >= MIN_SIMILARITY
    ]

    # Agrupa chunks por advisor_id
    by_advisor = defaultdict(list)
    for chunk in relevant_chunks:
        scored = {
            **chunk,
            "chunk_score": score_chunk(chunk),
        }
        by_advisor[chunk["advisor_id"]].append(scored)

    # Calcula score por asesor (promedio de top-M chunks * coverage boost)
    advisor_scores = []
    for advisor_id, advisor_chunks in by_advisor.items():
        sorted_chunks = sorted(advisor_chunks, key=lambda c: c["chunk_score"], reverse=True)
        top_chunks = sorted_chunks[:chunks_per_advisor]

        avg_score = sum(c["chunk_score"] for c in top_chunks) / len(top_chunks)
        boosted_score = avg_score * coverage_boost(len(advisor_chunks))

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
            "score": round(boosted_score, 4),
            "num_matching_chunks": len(advisor_chunks),
            "evidence": evidence,
        })

    # Ordena por score descendente
    advisor_scores.sort(key=lambda a: a["score"], reverse=True)
    return advisor_scores[:top_k]
