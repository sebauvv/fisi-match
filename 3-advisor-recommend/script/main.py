"""
CLI del motor de recomendacion de asesores (Fase 3).

Recibe la idea de tesis del estudiante y retorna los top-K asesores
con sus scores y explicaciones RAG.

Uso:
    python main.py --idea "Aplicacion de NLP para clasificar documentos legales"
    python main.py --idea "Sistema de deteccion de fraudes con ML" --top-k 3
    python main.py --idea "..." --no-explain   (sin llamada al LLM)
"""

import argparse
import json
import sys
import time

from config import TOP_K, KNN_LIMIT
from embedder import embed_text
from db_client import get_connection, search_similar_chunks
from recommender import rank_advisors
from explainer import generate_explanations


def parse_args():
    parser = argparse.ArgumentParser(
        description="Motor de recomendacion de asesores de tesis (Fase 3)"
    )
    parser.add_argument(
        "--idea", required=True, help="Idea o tema de tesis del estudiante"
    )
    parser.add_argument(
        "--top-k", type=int, default=TOP_K, help=f"Cantidad de asesores a recomendar (default: {TOP_K})"
    )
    parser.add_argument(
        "--knn-limit", type=int, default=KNN_LIMIT, help=f"Chunks kNN a recuperar (default: {KNN_LIMIT})"
    )
    parser.add_argument(
        "--no-explain", action="store_true", help="Omite la generacion de explicaciones RAG"
    )
    parser.add_argument(
        "--output", choices=["json", "text"], default="text", help="Formato de salida"
    )
    return parser.parse_args()


def print_text_output(result):
    """Imprime resultado en formato legible."""
    print(f"\nIdea de tesis: \"{result['query']}\"\n")

    for rec in result["recommendations"]:
        print(f"  {rec['rank']}. {rec['advisor_name']} (score: {rec['score']})")
        if rec.get("orcid"):
            print(f"     ORCID: {rec['orcid']}")
        print(f"     Tesis dirigidas: {rec.get('thesis_count', 'N/A')}")
        print(f"     Chunks relevantes: {rec.get('num_matching_chunks', 0)}")

        if rec.get("explanation"):
            print(f"\n     Justificacion:")
            for line in rec["explanation"].split(". "):
                print(f"       {line.strip()}.")

        print(f"\n     Evidencia:")
        for ev in rec.get("matching_evidence", [])[:5]:
            year_str = f" ({ev['year']})" if ev.get("year") else ""
            print(f"       [{ev['content_type'].upper()}{year_str}] "
                  f"sim={ev['similarity']} | {ev['content_text'][:120]}...")

        print()


def main():
    args = parse_args()
    start = time.time()

    # 1. Embedding de la idea del estudiante
    print("1. Generando embedding de la idea...")
    query_embedding = embed_text(args.idea)
    print(f"   Vector generado ({len(query_embedding)}d)")

    # 2. Busqueda kNN en pgvector
    print("2. Buscando chunks similares en la base de datos...")
    conn = get_connection()
    try:
        chunks = search_similar_chunks(conn, query_embedding, limit=args.knn_limit)
        print(f"   {len(chunks)} chunks recuperados")
    finally:
        conn.close()

    if not chunks:
        print("No se encontraron resultados.")
        sys.exit(0)

    # 3. Scoring y ranking
    print("3. Calculando scores con peso temporal...")
    recommendations = rank_advisors(chunks, top_k=args.top_k)
    print(f"   Top {len(recommendations)} asesores rankeados")

    # 4. Explicaciones RAG
    explanations = {}
    if not args.no_explain:
        print("4. Generando explicaciones RAG (Nova Lite)...")
        explanations = generate_explanations(args.idea, recommendations)
        print(f"   {len(explanations)} explicaciones generadas")

    # 5. Construye el resultado final
    result = {
        "query": args.idea,
        "top_k": args.top_k,
        "knn_limit": args.knn_limit,
        "elapsed_seconds": round(time.time() - start, 2),
        "recommendations": [],
    }

    for i, rec in enumerate(recommendations, 1):
        entry = {
            "rank": i,
            "advisor_id": rec["advisor_id"],
            "advisor_name": rec["advisor_name"],
            "score": rec["score"],
            "orcid": rec.get("orcid"),
            "thesis_count": rec.get("thesis_count"),
            "num_matching_chunks": rec.get("num_matching_chunks", 0),
            "explanation": explanations.get(rec["advisor_id"], ""),
            "matching_evidence": rec.get("evidence", []),
        }
        result["recommendations"].append(entry)

    # 6. Output
    if args.output == "json":
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        print_text_output(result)

    print(f"Completado en {result['elapsed_seconds']}s")


if __name__ == "__main__":
    main()
