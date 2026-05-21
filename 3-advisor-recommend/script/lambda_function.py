import time
import json
from explainer import generate_explanations

# -TODO- (DONE)
# REFACTORIZAR PARA QUE LA CONEXION A LA DB YA NO SEA DESDE EL LAMBDA, SINO DESDE LA API PROPIA
# LOGRANDO ASI PASAR AL LAMBDA SOLO LOS PARAMETROS DE LOS RESULTADOS DE KNN OBTENIDOS DESDE LA API
# Y QUE EL LAMBDA SOLO HAGA LA PARTE DE RAG, SOLO EXPLICA LA RECOMENDACION, SIN TENER QUE HACER EMBEDDING NI KNN SEARCH, SIMPLEMENTE RECIBIENDO LOS DATOS YA PROCESADOS DESDE LA API
def lambda_handler(event, context):
    """
    AWS Lambda entry point para la Fase 3 del recomendador de asesores.

    Contrato de entrada (nuevo - solo RAG):
    El embedding, kNN search y scoring ya fueron realizados por el backend FastAPI.
    Este Lambda SOLO genera las explicaciones RAG usando Bedrock Nova Lite.

    Payload esperado:
    {
        "thesis_idea": "Aplicacion de NLP para clasificar documentos legales",
        "recommendations": [
            {
                "advisor_id": "abc123",
                "advisor_name": "Rodriguez Rodriguez, Ciro",
                "score": 0.87,
                "orcid": "0000-0001-...",
                "thesis_count": 12,
                "evidence": [
                    {
                        "content_type": "thesis",
                        "content_text": "...",
                        "similarity": 0.92,
                        "chunk_score": 1.12,
                        "year": 2024
                    }
                ]
            }
        ],
        "no_explain": false
    }

    Respuesta:
    {
        "statusCode": 200,
        "body": {
            "explanations": {
                "abc123": "Este asesor es recomendado porque..."
            }
        }
    }
    """
    # Si viene desde API Gateway, los datos pueden estar en body
    body = event
    if "body" in event:
        raw_body = event["body"]
        if isinstance(raw_body, bytes):
            raw_body = raw_body.decode("utf-8")
        if isinstance(raw_body, str):
            body = json.loads(raw_body)

    idea = (body.get("thesis_idea") or "").strip()
    if not idea:
        return {
            "statusCode": 400,
            "body": json.dumps({"error": "Missing 'thesis_idea' parameter"}, ensure_ascii=False),
        }

    recommendations = body.get("recommendations", [])
    if not recommendations:
        return {
            "statusCode": 400,
            "body": json.dumps({"error": "Missing 'recommendations' parameter"}, ensure_ascii=False),
        }

    no_explain = body.get("no_explain", False)

    start = time.time()

    # RAG: genera explicaciones usando la evidencia ya calculada por el backend
    explanations = {}
    if not no_explain:
        explanations = generate_explanations(idea, recommendations)

    result = {
        "explanations": explanations,
        "elapsed_seconds": round(time.time() - start, 2),
    }

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json; charset=utf-8"},
        "body": json.dumps(result, ensure_ascii=False),
    }
