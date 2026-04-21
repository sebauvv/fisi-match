"""
Pobla las tablas de catalogo y datos fuente desde los JSONs de Fase 1.

Tablas que maneja este script:
  publication_types  -- catalogo fijo de 13 tipos con etiqueta en espanol
  research_areas     -- areas unicas extraidas de advisors.json
  thesis_subjects    -- materias unicas extraidas de theses.json
  theses             -- tesis de Cybertesis
  external_publications -- publicaciones de ORCID/Scopus

Ademas actualiza en advisors:
  external_publications_count

No toca: advisors (datos base), knowledge_vectors (embeddings).

Uso:
    python seed_catalog.py
    python seed_catalog.py --clear      Limpia las tablas nuevas antes de insertar
    python seed_catalog.py --dry-run    Muestra conteos sin hacer commit
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

PUBLICATION_TYPE_LABELS = {
    "book":                "Libro",
    "book-chapter":        "Capítulo de libro",
    "conference-paper":    "Ponencia en conferencia",
    "conference-poster":   "Póster en conferencia",
    "dissertation-thesis": "Tesis / Disertación",
    "journal-article":     "Artículo de revista",
    "journal-issue":       "Número de revista",
    "magazine-article":    "Artículo de revista de divulgación",
    "other":               "Otro",
    "patent":              "Patente",
    "preprint":            "Preprint",
    "registered-copyright":"Copyright registrado",
    "research-tool":       "Herramienta de investigación",
}


def get_connection():
    """Establece conexion a PostgreSQL segun variables de entorno."""
    db_url = os.getenv("DATABASE_URL")
    if db_url:
        return psycopg2.connect(db_url)

    return psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "5433")),
        dbname=os.getenv("DB_NAME", "advisors_db"),
        user=os.getenv("DB_USER", "advisor_user"),
        password=os.getenv("DB_PASSWORD", "advisor_local_pass"),
    )


def load_json(path):
    """Carga y parsea un archivo JSON relativo al directorio de este script."""
    resolved = os.path.join(os.path.dirname(__file__), path)
    with open(resolved, "r", encoding="utf-8") as f:
        return json.load(f)


def clear_tables(conn):
    """Elimina todos los datos de las tablas nuevas (respeta FK order)."""
    with conn.cursor() as cur:
        cur.execute("DELETE FROM external_publications")
        cur.execute("DELETE FROM theses")
        cur.execute("DELETE FROM thesis_subjects")
        cur.execute("DELETE FROM research_areas")
        cur.execute("DELETE FROM publication_types")
        cur.execute("UPDATE advisors SET external_publications_count = 0")
    conn.commit()
    print("Tablas de catalogo limpiadas.")


def seed_publication_types(conn, dry_run=False):
    """Inserta el catalogo fijo de tipos de publicacion."""
    rows = [(code, label) for code, label in PUBLICATION_TYPE_LABELS.items()]
    print(f"  publication_types: {len(rows)} tipos")
    if dry_run:
        return len(rows)

    with conn.cursor() as cur:
        execute_values(
            cur,
            """
            INSERT INTO publication_types (code, label_es)
            VALUES %s
            ON CONFLICT (code) DO UPDATE SET label_es = EXCLUDED.label_es
            """,
            rows,
        )
    conn.commit()
    return len(rows)


def seed_research_areas(conn, advisors_path, dry_run=False):
    """Extrae areas unicas de advisors.json y las inserta en research_areas."""
    data = load_json(advisors_path)
    advisors = data.get("advisors", data) if isinstance(data, dict) else data

    area_advisor_count = {}
    for a in advisors:
        for area in a.get("research_areas") or []:
            area = area.strip()
            if area:
                area_advisor_count[area] = area_advisor_count.get(area, 0) + 1

    rows = [(name, count) for name, count in area_advisor_count.items()]
    print(f"  research_areas: {len(rows)} areas unicas")
    if dry_run:
        return len(rows)

    with conn.cursor() as cur:
        execute_values(
            cur,
            """
            INSERT INTO research_areas (name, advisor_count)
            VALUES %s
            ON CONFLICT (name) DO UPDATE SET advisor_count = EXCLUDED.advisor_count
            """,
            rows,
        )
    conn.commit()
    return len(rows)


def seed_thesis_subjects(conn, theses_path, dry_run=False):
    """Extrae materias unicas de theses.json y las inserta en thesis_subjects."""
    data = load_json(theses_path)
    theses = data.get("theses", data) if isinstance(data, dict) else data

    subject_thesis_count = {}
    for t in theses:
        for subj in t.get("subjects") or []:
            subj = subj.strip()
            if subj:
                subject_thesis_count[subj] = subject_thesis_count.get(subj, 0) + 1

    rows = [(name, count) for name, count in subject_thesis_count.items()]
    print(f"  thesis_subjects: {len(rows)} materias unicas")
    if dry_run:
        return len(rows)

    with conn.cursor() as cur:
        execute_values(
            cur,
            """
            INSERT INTO thesis_subjects (name, thesis_count)
            VALUES %s
            ON CONFLICT (name) DO UPDATE SET thesis_count = EXCLUDED.thesis_count
            """,
            rows,
        )
    conn.commit()
    return len(rows)


def seed_theses(conn, theses_path, batch_size=200, dry_run=False):
    """Inserta las tesis en la tabla theses."""
    data = load_json(theses_path)
    theses = data.get("theses", data) if isinstance(data, dict) else data
    total = len(theses)
    print(f"  theses: {total} registros")
    if dry_run:
        return total

    inserted = 0
    for i in range(0, total, batch_size):
        batch = theses[i: i + batch_size]
        rows = []
        for t in batch:
            rows.append((
                t["id"],
                t.get("title", ""),
                t.get("abstract"),
                t.get("author"),
                t.get("date_issued"),
                t.get("year"),
                t.get("subjects") or [],
                t.get("subject_ocde") or [],
                t.get("thesis_type"),
                t.get("degree_level"),
                t.get("degree_name"),
                t.get("degree_discipline"),
                t.get("degree_grantor"),
                t.get("citation"),
                t.get("handle_url"),
                t.get("language"),
                t.get("jurors") or [],
                t.get("advisor_id"),
                t.get("advisor_name"),
            ))

        with conn.cursor() as cur:
            execute_values(
                cur,
                """
                INSERT INTO theses (
                    id, title, abstract, author, date_issued, year,
                    subjects, subject_ocde, thesis_type, degree_level,
                    degree_name, degree_discipline, degree_grantor,
                    citation, handle_url, language, jurors,
                    advisor_id, advisor_name
                )
                VALUES %s
                ON CONFLICT (id) DO UPDATE SET
                    title             = EXCLUDED.title,
                    abstract          = EXCLUDED.abstract,
                    author            = EXCLUDED.author,
                    date_issued       = EXCLUDED.date_issued,
                    year              = EXCLUDED.year,
                    subjects          = EXCLUDED.subjects,
                    subject_ocde      = EXCLUDED.subject_ocde,
                    thesis_type       = EXCLUDED.thesis_type,
                    degree_level      = EXCLUDED.degree_level,
                    degree_name       = EXCLUDED.degree_name,
                    degree_discipline = EXCLUDED.degree_discipline,
                    degree_grantor    = EXCLUDED.degree_grantor,
                    citation          = EXCLUDED.citation,
                    handle_url        = EXCLUDED.handle_url,
                    language          = EXCLUDED.language,
                    jurors            = EXCLUDED.jurors,
                    advisor_id        = EXCLUDED.advisor_id,
                    advisor_name      = EXCLUDED.advisor_name
                """,
                rows,
            )
        conn.commit()
        inserted += len(batch)
        pct = (inserted / total) * 100
        sys.stdout.write(f"\r    Insertadas: {inserted}/{total} ({pct:.1f}%)")
        sys.stdout.flush()

    print("")
    return inserted


def seed_external_publications(conn, pubs_path, batch_size=200, dry_run=False):
    """Inserta las publicaciones externas en external_publications."""
    data = load_json(pubs_path)
    pubs = data.get("publications", data) if isinstance(data, dict) else data
    total = len(pubs)
    print(f"  external_publications: {total} registros")
    if dry_run:
        return total

    inserted = 0
    for i in range(0, total, batch_size):
        batch = pubs[i: i + batch_size]
        rows = []
        for p in batch:
            pub_type = p.get("type") or None
            if pub_type and pub_type not in PUBLICATION_TYPE_LABELS:
                pub_type = "other"
            rows.append((
                p.get("advisor_id"),
                p.get("advisor_name"),
                p.get("orcid"),
                p.get("title", ""),
                pub_type,
                p.get("year"),
                p.get("journal") or None,
                p.get("doi") or None,
                p.get("external_url") or None,
            ))

        with conn.cursor() as cur:
            execute_values(
                cur,
                """
                INSERT INTO external_publications (
                    advisor_id, advisor_name, orcid, title,
                    type, year, journal, doi, external_url
                )
                VALUES %s
                """,
                rows,
            )
        conn.commit()
        inserted += len(batch)
        pct = (inserted / total) * 100
        sys.stdout.write(f"\r    Insertadas: {inserted}/{total} ({pct:.1f}%)")
        sys.stdout.flush()

    print("")
    return inserted


def update_external_publications_count(conn, dry_run=False):
    """Actualiza external_publications_count en advisors."""
    if dry_run:
        print("  (dry-run) Se actualizaria external_publications_count en advisors")
        return
    with conn.cursor() as cur:
        cur.execute("""
            UPDATE advisors a
              SET external_publications_count = (
                SELECT COUNT(*) FROM external_publications ep WHERE ep.advisor_id = a.id
              )
        """)
        updated = cur.rowcount
    conn.commit()
    print(f"  advisors actualizados con external_publications_count: {updated}")


def update_publication_type_counts(conn, dry_run=False):
    """Actualiza pub_count en publication_types desde external_publications."""
    if dry_run:
        return
    with conn.cursor() as cur:
        cur.execute("""
            UPDATE publication_types pt
              SET pub_count = (
                SELECT COUNT(*) FROM external_publications ep WHERE ep.type = pt.code
              )
        """)
    conn.commit()


def main():
    parser = argparse.ArgumentParser(
        description="Pobla tablas de catalogo y datos fuente desde JSONs de Fase 1"
    )
    parser.add_argument("--clear",   action="store_true", help="Limpia tablas antes de insertar")
    parser.add_argument("--dry-run", action="store_true", help="Muestra conteos sin hacer commit")
    args = parser.parse_args()

    advisors_path = os.getenv("ADVISORS_PATH",            "../../1-scraper/output/advisors.json")
    theses_path   = os.getenv("THESES_PATH",              "../../1-scraper/output/theses.json")
    pubs_path     = os.getenv("EXTERNAL_PUBS_PATH",       "../../1-scraper/output/external_publications.json")

    mode = os.getenv("DB_MODE", "local")
    print(f"Modo: {mode}")
    print(f"Host: {os.getenv('DB_HOST', 'localhost')}:{os.getenv('DB_PORT', '5433')}")

    conn = get_connection()
    print("Conexion establecida.")

    if args.dry_run:
        print("\n[DRY-RUN] Conteos que se insertarian:")

    try:
        if args.clear and not args.dry_run:
            clear_tables(conn)

        start = time.time()

        print("\n[1/6] Tipos de publicacion...")
        n_types = seed_publication_types(conn, dry_run=args.dry_run)

        print("\n[2/6] Areas de investigacion...")
        n_areas = seed_research_areas(conn, advisors_path, dry_run=args.dry_run)

        print("\n[3/6] Materias de tesis...")
        n_subjects = seed_thesis_subjects(conn, theses_path, dry_run=args.dry_run)

        print("\n[4/6] Tesis...")
        n_theses = seed_theses(conn, theses_path, dry_run=args.dry_run)

        print("\n[5/6] Publicaciones externas...")
        n_pubs = seed_external_publications(conn, pubs_path, dry_run=args.dry_run)

        print("\n[6/6] Actualizando contadores...")
        update_external_publications_count(conn, dry_run=args.dry_run)
        update_publication_type_counts(conn, dry_run=args.dry_run)

        elapsed = time.time() - start
        tag = " (dry-run)" if args.dry_run else ""
        print(f"\nSeed de catalogo completado{tag} en {elapsed:.1f}s")
        print(f"  publication_types : {n_types}")
        print(f"  research_areas    : {n_areas}")
        print(f"  thesis_subjects   : {n_subjects}")
        print(f"  theses            : {n_theses}")
        print(f"  external_pubs     : {n_pubs}")

    finally:
        conn.close()


if __name__ == "__main__":
    main()
