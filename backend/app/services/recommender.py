"""
Servicio de recomendación de asesores para el backend FastAPI.

Implementa las tres etapas previas a la explicación RAG:
  1. embed_idea()            — embedding via Bedrock Titan v2
  2. search_similar_chunks() — kNN cosine search en pgvector
  3. rank_advisors()         — scoring temporal y ranking por asesor

"""

import json
from collections import defaultdict
from typing import Any

import boto3
import psycopg2
from botocore.config import Config as BotoConfig
from psycopg2.extras import RealDictCursor

from app.config import get_settings

settings = get_settings()

# Parámetros de scoring
RECENCY_BOOST = settings.recency_boost
CHUNKS_PER_ADVISOR = 10
MIN_YEAR = 1997
MAX_YEAR = 2026


# 1. Embedding

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


# 2. kNN Search en pgvector

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
    limit: int = 50,
) -> list[dict[str, Any]]:
    """
    Busca los chunks más similares al embedding de la consulta en pgvector.

    Retorna una lista de dicts con: advisor_id, advisor_name, orcid, thesis_count,
    content_type, content_text, year, metadata, source_id, similarity.

    Se usa ef_search=200 para garantizar recall consistente con el índice HNSW
    (el default de 40 produce variaciones en el borde de knn_limit).

    Args:
        query_embedding: vector de 1024 dimensiones (salida de embed_idea)
        limit: cantidad máxima de chunks a retornar

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


# 3. Scoring y Ranking

def _temporal_weight(year) -> float:
    """
    Calcula el peso temporal de un chunk.

    Publicaciones recientes reciben un boost proporcional;
    chunks sin año (perfiles) no reciben penalización (piso 1.0).
    """
    if year is None:
        return 1.0
    normalized = (year - MIN_YEAR) / max(MAX_YEAR - MIN_YEAR, 1)
    normalized = max(0.0, min(1.0, normalized))
    return 1.0 + RECENCY_BOOST * normalized


def _score_chunk(chunk: dict) -> float:
    """Aplica la fórmula de scoring a un chunk individual."""
    sim = float(chunk["similarity"])
    weight = _temporal_weight(chunk.get("year"))
    return sim * weight


def rank_advisors(
    chunks: list[dict],
    top_k: int = 5,
    chunks_per_advisor: int = CHUNKS_PER_ADVISOR,
) -> list[dict[str, Any]]:
    """
    Agrupa chunks por asesor, calcula el score de cada uno y retorna
    los top-K asesores ordenados por score.

    Fórmula:
        chunk_score = cosine_sim * temporal_weight(year)
        advisor_score = mean(top_M_chunk_scores)  [M = chunks_per_advisor]

    Esto evita que asesores con muchas publicaciones tengan ventaja por volumen.

    Args:
        chunks: resultado de search_similar_chunks()
        top_k: cantidad de asesores a retornar
        chunks_per_advisor: cantidad máxima de chunks por asesor para el promedio

    Returns:
        lista de dicts ordenada: advisor_id, advisor_name, score, evidence, ...
    """
    by_advisor = defaultdict(list)
    for chunk in chunks:
        scored = {**chunk, "chunk_score": _score_chunk(chunk)}
        by_advisor[chunk["advisor_id"]].append(scored)

    advisor_scores = []
    for advisor_id, advisor_chunks in by_advisor.items():
        sorted_chunks = sorted(advisor_chunks, key=lambda c: c["chunk_score"], reverse=True)
        top_chunks = sorted_chunks[:chunks_per_advisor]

        avg_score = sum(c["chunk_score"] for c in top_chunks) / len(top_chunks)

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
            "score": round(avg_score, 4),
            "num_matching_chunks": len(advisor_chunks),
            "evidence": evidence,
        })

    advisor_scores.sort(key=lambda a: a["score"], reverse=True)
    return advisor_scores[:top_k]
