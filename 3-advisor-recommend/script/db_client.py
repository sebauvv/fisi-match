"""
Cliente de conexion a PostgreSQL + pgvector.

Ejecuta queries kNN contra la tabla knowledge_vectors
y obtiene metadata de asesores.
"""

import psycopg2
from psycopg2.extras import RealDictCursor
from config import DB_CONFIG, MODE


import os

def get_connection():
    """Abre conexion a PostgreSQL con la configuracion actual."""
    db_url = os.getenv("DATABASE_URL")
    if MODE == 'cloud':
        return psycopg2.connect(db_url)
    return psycopg2.connect(**DB_CONFIG)


def search_similar_chunks(conn, query_embedding, limit=50):
    """
    Busca los chunks mas similares al embedding de la consulta.

    Retorna una lista de dicts con: advisor_id, full_name, content_type,
    content_text, year, metadata, similarity (1 - distancia coseno).

    Args:
        conn: conexion psycopg2
        query_embedding: lista de floats (1024d)
        limit: cantidad maxima de chunks a retornar
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

    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        # Se aumenta ef_search para garantizar recall consistente en HNSW
        # El valor por defecto de 40 hizo que los chunks cerca del borde de
        # knn_limit varien entre ejecuciones xd (comparando lo que de local con Lambda).
        # Con 2311 vectores, ef_search=200 sigue siendo sub-milisegundo
        cur.execute("SET LOCAL hnsw.ef_search = 200;")
        cur.execute(query, (embedding_str, embedding_str, limit))
        rows = cur.fetchall()
        # Para limpiar strings. Por si la db o psycopg devuelve valores con
        # espacios al final si los datos fueron insertados con padding
        return [
            {k: (v.strip() if isinstance(v, str) else v) for k, v in row.items()}
            for row in rows
        ]


def get_advisor_info(conn, advisor_id):
    """Obtiene la informacion completa de un asesor por su ID."""
    query = """
        SELECT id, full_name, name_variants, thesis_count, orcid,
               research_areas, scraped_at
        FROM advisors
        WHERE id = %s
    """
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(query, (advisor_id,))
        return cur.fetchone()
