"""
Servicio de recomendación de asesores para el backend FastAPI.

Implementa las tres etapas previas a la explicación RAG:
  1. embed_idea()            — embedding via Bedrock Titan v2
  2. search_similar_chunks() — kNN cosine search en pgvector
  3. rank_advisors()         — scoring temporal + content-type + cobertura

Motor de scoring v2:
  chunk_score = cosine_sim × temporal_weight(year) × content_type_weight(type)
  advisor_score = mean(top_M_chunk_scores) × coverage_boost(num_relevant)

Cambios vs v1:
  - Content-type boosting: thesis > publication > profile
  - Decaimiento temporal exponencial (últimos 5 años pesan significativamente más)
  - Filtro de similitud mínima (MIN_SIMILARITY) para descartar ruido
  - Coverage boost: asesores con más evidencia relevante reciben un bonus logarítmico
  - kNN expandido por defecto (200 → mejor cobertura de asesores)
"""

import json
import math
from collections import defaultdict
from typing import Any

import boto3
import psycopg2
from botocore.config import Config as BotoConfig
from psycopg2.extras import RealDictCursor

from app.config import get_settings

settings = get_settings()

# ── Parámetros de scoring ────────────────────────────────────────────────────

RECENCY_BOOST = settings.recency_boost      # max boost para publicaciones recientes
CHUNKS_PER_ADVISOR = 10                      # top-M chunks por asesor para promediar
MIN_YEAR = 1997
MAX_YEAR = 2026
TEMPORAL_DECAY_RATE = 5.0                    # años de vida media del decaimiento exponencial

# Peso por tipo de contenido: evidencia directa > indirecta > genérica
CONTENT_TYPE_WEIGHTS = {
    "thesis":      1.30,   # Evidencia directa: dirigió una tesis sobre el tema
    "publication": 1.15,   # Evidencia indirecta: publicó sobre el tema
    "profile":     1.00,   # Señal débil: su perfil menciona el área
}

# Similitud mínima para considerar un chunk relevante
MIN_SIMILARITY = 0.30

# Factor de boost por cobertura (cuántos chunks relevantes tiene el asesor)
COVERAGE_ALPHA = 0.10


# ── 1. Embedding ─────────────────────────────────────────────────────────────

def _get_bedrock_client():
    """
    Crea cliente Bedrock Runtime usando las credenciales IAM del backend_invoker
    (ADVISOR_LAMBDA_ACCESS_KEY_ID / ADVISOR_LAMBDA_SECRET_ACCESS_KEY).
    Estas mismas credenciales tienen permisos de bedrock:InvokeModel y lambda:InvokeFunction.
    """
    if settings.advisor_lambda_access_key_id and settings.advisor_lambda_secret_access_key:
        return boto3.client(
            "bedrock-runtime",
            region_name=settings.advisor_lambda_region,
            aws_access_key_id=settings.advisor_lambda_access_key_id,
            aws_secret_access_key=settings.advisor_lambda_secret_access_key,
            config=BotoConfig(retries={"max_attempts": 3, "mode": "adaptive"}),
        )
    # Fallback: cadena de credenciales por defecto (ej. variables de entorno AWS_*)
    return boto3.client(
        "bedrock-runtime",
        region_name=settings.advisor_lambda_region,
        config=BotoConfig(retries={"max_attempts": 3, "mode": "adaptive"}),
    )


def embed_idea(text: str) -> list[float]:
    """
    Genera el embedding de la idea de tesis usando Bedrock Titan Embeddings v2.

    Usa el mismo modelo que Fase 2 para mantener coherencia en el espacio semántico.

    Args:
        text: la idea de tesis del estudiante

    Returns:
        vector de 1024 dimensiones
    """
    client = _get_bedrock_client()

    payload = json.dumps({
        "inputText": text,
        "dimensions": settings.embedding_dimensions,
    })

    response = client.invoke_model(
        modelId=settings.embedding_model,
        contentType="application/json",
        accept="application/json",
        body=payload,
    )

    body = json.loads(response["body"].read())
    return body["embedding"]


# ── 2. kNN Search en pgvector ────────────────────────────────────────────────

def _get_db_connection():
    """
    Abre conexión directa con psycopg2 a la base de datos.
    Necesario para usar SET LOCAL hnsw.ef_search, que SQLAlchemy no expone fácilmente.
    """
    db_url = settings.database_url
    if db_url:
        # Asegura formato postgresql:// (sin +psycopg2)
        db_url = db_url.replace("postgresql+psycopg2://", "postgresql://")
        return psycopg2.connect(db_url)

    return psycopg2.connect(
        host=settings.db_host,
        port=settings.db_port,
        dbname=settings.db_name,
        user=settings.db_user,
        password=settings.db_password,
    )


def search_similar_chunks(
    query_embedding: list[float],
    limit: int = 200,
) -> list[dict[str, Any]]:
    """
    Busca los chunks más similares al embedding de la consulta en pgvector.

    Retorna una lista de dicts con: advisor_id, advisor_name, orcid, thesis_count,
    content_type, content_text, year, metadata, source_id, similarity.

    Se usa ef_search=200 para garantizar recall consistente con el índice HNSW
    (el default de 40 produce variaciones en el borde de knn_limit).

    Se amplía el límite por defecto a 200 (vs 50 original) para capturar
    más asesores relevantes que podrían quedar fuera en un retrieval estrecho.

    Args:
        query_embedding: vector de 1024 dimensiones (salida de embed_idea)
        limit: cantidad máxima de chunks a retornar (default: 200)

    Returns:
        lista de dicts listos para pasar a rank_advisors()
    """
    embedding_str = "[" + ",".join(str(x) for x in query_embedding) + "]"

    query = """
        SELECT
            kv.advisor_id,
            a.full_name AS advisor_name,
            a.orcid,
            a.thesis_count,
            kv.content_type,
            kv.content_text,
            kv.year,
            kv.metadata,
            kv.source_id,
            1 - (kv.embedding <=> %s::vector) AS similarity
        FROM knowledge_vectors kv
        JOIN advisors a ON kv.advisor_id = a.id
        ORDER BY kv.embedding <=> %s::vector
        LIMIT %s
    """

    conn = _get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # si se aumenta ef_search se garantiza recall consistente en HNSW
            cur.execute("SET LOCAL hnsw.ef_search = 200;")
            cur.execute(query, (embedding_str, embedding_str, limit))
            rows = cur.fetchall()
            return [
                {k: (v.strip() if isinstance(v, str) else v) for k, v in row.items()}
                for row in rows
            ]
    finally:
        conn.close()


# ── 3. Scoring y Ranking (v2) ────────────────────────────────────────────────

def _temporal_weight(year) -> float:
    """
    Calcula el peso temporal de un chunk usando decaimiento exponencial.

    A diferencia del boost lineal original (diferencia mínima entre 2020 y 2026),
    el decaimiento exponencial con DECAY_RATE=5 produce:
      - 2026: +0.30 (boost máximo)
      - 2021: +0.16
      - 2016: +0.04
      - 2010: +0.01
      - 1997: ~+0.00

    Chunks sin año (perfiles) no reciben penalización (piso 1.0).
    """
    if year is None:
        return 1.0
    age = max(MAX_YEAR - year, 0)
    return 1.0 + RECENCY_BOOST * math.exp(-age / TEMPORAL_DECAY_RATE)


def _content_type_weight(content_type: str) -> float:
    """
    Retorna el peso multiplicativo según el tipo de contenido.

    thesis (1.3) > publication (1.15) > profile (1.0)
    """
    return CONTENT_TYPE_WEIGHTS.get(content_type, 1.0)


def _score_chunk(chunk: dict) -> float:
    """
    Aplica la fórmula de scoring v2 a un chunk individual.

    chunk_score = cosine_sim × temporal_weight(year) × content_type_weight(type)
    """
    sim = float(chunk["similarity"])
    t_weight = _temporal_weight(chunk.get("year"))
    ct_weight = _content_type_weight(chunk.get("content_type", "profile"))
    return sim * t_weight * ct_weight


def _coverage_boost(num_relevant_chunks: int) -> float:
    """
    Calcula un boost multiplicativo basado en la cantidad de evidencia relevante.

    Fórmula: 1 + α × log(n + 1)

    Con α=0.10:
      - 1 chunk:  ×1.07
      - 3 chunks: ×1.14
      - 10 chunks: ×1.24
      - 20 chunks: ×1.30

    Recompensa asesores con evidencia diversa sin que el volumen domine.
    """
    return 1.0 + COVERAGE_ALPHA * math.log(num_relevant_chunks + 1)


def rank_advisors(
    chunks: list[dict],
    top_k: int = 5,
    chunks_per_advisor: int = CHUNKS_PER_ADVISOR,
) -> list[dict[str, Any]]:
    """
    Agrupa chunks por asesor, calcula el score de cada uno y retorna
    los top-K asesores ordenados por score.

    Fórmula v2:
        chunk_score = cosine_sim × temporal_weight(year) × content_type_weight(type)
        advisor_score = mean(top_M_chunk_scores) × coverage_boost(num_relevant)

    Mejoras vs v1:
        - Filtra chunks por debajo de MIN_SIMILARITY (descarta ruido)
        - Pondera por tipo de contenido (thesis > publication > profile)
        - Decaimiento temporal exponencial (últimos 5 años pesan más)
        - Coverage boost logarítmico (más evidencia = más confianza)

    Args:
        chunks: resultado de search_similar_chunks()
        top_k: cantidad de asesores a retornar
        chunks_per_advisor: cantidad máxima de chunks por asesor para el promedio

    Returns:
        lista de dicts ordenada: advisor_id, advisor_name, score, evidence, ...
    """
    # Filtrar chunks por debajo del umbral de similitud
    relevant_chunks = [
        c for c in chunks if float(c["similarity"]) >= MIN_SIMILARITY
    ]

    by_advisor = defaultdict(list)
    for chunk in relevant_chunks:
        scored = {**chunk, "chunk_score": _score_chunk(chunk)}
        by_advisor[chunk["advisor_id"]].append(scored)

    advisor_scores = []
    for advisor_id, advisor_chunks in by_advisor.items():
        sorted_chunks = sorted(advisor_chunks, key=lambda c: c["chunk_score"], reverse=True)
        top_chunks = sorted_chunks[:chunks_per_advisor]

        avg_score = sum(c["chunk_score"] for c in top_chunks) / len(top_chunks)

        # Coverage boost: más chunks relevantes → más confianza en la recomendación
        boosted_score = avg_score * _coverage_boost(len(advisor_chunks))

        evidence = [
            {
                "content_type": c["content_type"],
                "content_text": c["content_text"],
                "similarity": round(float(c["similarity"]), 4),
                "chunk_score": round(c["chunk_score"], 4),
                "year": c.get("year"),
                "source_id": c.get("source_id"),
            }
            for c in top_chunks
        ]

        advisor_scores.append({
            "advisor_id": advisor_id,
            "advisor_name": advisor_chunks[0].get("advisor_name", ""),
            "orcid": advisor_chunks[0].get("orcid"),
            "thesis_count": advisor_chunks[0].get("thesis_count"),
            "score": round(boosted_score, 4),
            "num_matching_chunks": len(advisor_chunks),
            "evidence": evidence,
        })

    advisor_scores.sort(key=lambda a: a["score"], reverse=True)
    return advisor_scores[:top_k]
