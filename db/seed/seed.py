"""
Pobla la base de datos PostgreSQL + pgvector desde los JSONs de Fase 1 y Fase 2.

Lee advisors.json para la tabla advisors y embeddings.json para knowledge_vectors.
Soporta modo local (Docker) y cloud (RDS) via .env.

Uso:
    python seed.py
    python seed.py --clear   # Limpia tablas antes de insertar
"""

import json
import os
import sys
import time
import argparse

import psycopg2
from psycopg2.extras import execute_values
from dotenv import load_dotenv

load_dotenv()


def get_connection():
    """Establece conexion a PostgreSQL segun variables de entorno."""
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "5433")),
        dbname=os.getenv("DB_NAME", "advisors_db"),
        user=os.getenv("DB_USER", "advisor_user"),
        password=os.getenv("DB_PASSWORD", "advisor_local_pass"),
    )


def load_json(path):
    """Carga y parsea un archivo JSON."""
    resolved = os.path.join(os.path.dirname(__file__), path)
    with open(resolved, "r", encoding="utf-8") as f:
        return json.load(f)


def clear_tables(conn):
    """Elimina todos los datos de las tablas (respeta FK order)."""
    with conn.cursor() as cur:
        cur.execute("DELETE FROM knowledge_vectors")
        cur.execute("DELETE FROM advisors")
    conn.commit()
    print("Tablas limpiadas.")


def seed_advisors(conn, advisors_path):
    """Inserta los perfiles de asesores en la tabla advisors."""
    data = load_json(advisors_path)
    advisors = data.get("advisors", data) if isinstance(data, dict) else data

    rows = []
    for a in advisors:
        rows.append((
            a["id"],
            a["full_name"],
            a.get("name_variants", []),
            a.get("thesis_count", 0),
            a.get("orcid"),
            a.get("advisor_dni"),
            a.get("research_areas", []),
            a.get("scraped_at"),
        ))

    with conn.cursor() as cur:
        execute_values(
            cur,
            """
            INSERT INTO advisors (id, full_name, name_variants, thesis_count, orcid, advisor_dni, research_areas, scraped_at)
            VALUES %s
            ON CONFLICT (id) DO UPDATE SET
                full_name = EXCLUDED.full_name,
                name_variants = EXCLUDED.name_variants,
                thesis_count = EXCLUDED.thesis_count,
                orcid = EXCLUDED.orcid,
                advisor_dni = EXCLUDED.advisor_dni,
                research_areas = EXCLUDED.research_areas,
                scraped_at = EXCLUDED.scraped_at
            """,
            rows,
        )
    conn.commit()
    print(f"Advisors insertados: {len(rows)}")
    return len(rows)


def seed_vectors(conn, embeddings_path, batch_size=100):
    """Inserta los vectores en knowledge_vectors en batches."""
    data = load_json(embeddings_path)
    vectors = data.get("vectors", [])
    total = len(vectors)

    print(f"Vectores a insertar: {total}")

    inserted = 0
    for i in range(0, total, batch_size):
        batch = vectors[i : i + batch_size]
        rows = []
        for v in batch:
            embedding_str = "[" + ",".join(str(x) for x in v["embedding"]) + "]"
            rows.append((
                v["advisor_id"],
                v["content_type"],
                v["content_text"],
                embedding_str,
                v.get("source_id"),
                v.get("year"),
                json.dumps(v.get("metadata", {})),
            ))

        with conn.cursor() as cur:
            execute_values(
                cur,
                """
                INSERT INTO knowledge_vectors
                    (advisor_id, content_type, content_text, embedding, source_id, year, metadata)
                VALUES %s
                """,
                rows,
            )
        conn.commit()
        inserted += len(batch)
        pct = (inserted / total) * 100
        sys.stdout.write(f"\r  Insertados: {inserted}/{total} ({pct:.1f}%)")
        sys.stdout.flush()

    print("")
    return inserted


def main():
    parser = argparse.ArgumentParser(description="Pobla la DB desde JSONs de Fase 1 y Fase 2")
    parser.add_argument("--clear", action="store_true", help="Limpia tablas antes de insertar")
    args = parser.parse_args()

    advisors_path = os.getenv("ADVISORS_PATH", "../1-scraper/output/advisors.json")
    embeddings_path = os.getenv("EMBEDDINGS_PATH", "../2-text-embedding/output/embeddings.json")

    mode = os.getenv("DB_MODE", "local")
    print(f"Modo: {mode}")
    print(f"Host: {os.getenv('DB_HOST', 'localhost')}:{os.getenv('DB_PORT', '5433')}")

    conn = get_connection()
    print("Conexion establecida.")

    try:
        if args.clear:
            clear_tables(conn)

        start = time.time()

        print("\n[1/2] Insertando advisors...")
        n_advisors = seed_advisors(conn, advisors_path)

        print("\n[2/2] Insertando knowledge_vectors...")
        n_vectors = seed_vectors(conn, embeddings_path)

        elapsed = time.time() - start
        print(f"\nSeed completado en {elapsed:.1f}s")
        print(f"  Advisors: {n_advisors}")
        print(f"  Vectores: {n_vectors}")

    finally:
        conn.close()


if __name__ == "__main__":
    main()
