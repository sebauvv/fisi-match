import time
import json
from embedder import embed_text
from db_client import get_connection, search_similar_chunks
from recommender import rank_advisors
from explainer import generate_explanations

def lambda_handler(event, context):
    """
    AWS Lambda entry point para la Fase 3 del recomendador de asesores.
    Recibe un JSON en "event" con los parámetros.
    """
    # Si viene desde API Gateway, los datos pueden estar en body o queryStringParameters
    body = event
    if "body" in event:
        raw_body = event["body"]
        if isinstance(raw_body, bytes):
            raw_body = raw_body.decode("utf-8")
        if isinstance(raw_body, str):
            body = json.loads(raw_body)
        
    idea = (body.get('thesis_idea') or '').strip()
    if not idea:
        return {
            "statusCode": 400,
            "body": json.dumps({"error": "Missing 'thesis_idea' parameter"}, ensure_ascii=False)
        }

    top_k = int(body.get('top_k', 5))
    knn_limit = int(body.get('knn_limit', 50))
    no_explain = body.get('no_explain', False)
    
    start = time.time()
    
    # 1. Embedding
    query_embedding = embed_text(idea)
    
    # 2. kNN Search
    conn = get_connection()
    try:
        chunks = search_similar_chunks(conn, query_embedding, limit=knn_limit)
    finally:
        conn.close()
        
    if not chunks:
        return {
            "statusCode": 200,
            "body": json.dumps({"message": "No results found for the given idea."}, ensure_ascii=False)
        }
        
    # 3. Scoring
    recommendations = rank_advisors(chunks, top_k=top_k)
    
    # 4. RAG Explanations
    explanations = {}
    if not no_explain:
        explanations = generate_explanations(idea, recommendations)
        
    # 5. Format results
    result = {
        "query": idea,
        "top_k": top_k,
        "knn_limit": knn_limit,
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
        
    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json; charset=utf-8"},
        "body": json.dumps(result, ensure_ascii=False)
    }
