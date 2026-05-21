# Fase 3: Motor de Recomendacion de Asesores

Motor de recomendación de asesores de tesis. El pipeline está dividido entre el **backend FastAPI** (embedding + kNN + scoring) y el **Lambda AWS** (explicaciones RAG ).

## Arquitectura

```
POST /recommendations (FastAPI backend)
        │
        ├─ 1. Bedrock Titan v2 ──► embedding (1024d) de la idea
        │
        ├─ 2. pgvector kNN ──────► top-N chunks similares (cosine distance)
        │
        ├─ 3. Scoring ───────────► agrupa por asesor, aplica peso temporal
        │                          ► top-K asesores rankeados
        │
        └─ 4. Lambda Invoke ─────► pasa idea + recommendations[] ya calculados
                    │
                    └─ Lambda: RAG
                               │
                               └─ Modelo X ──► {advisor_id: explanation}
        │
        └─ Backend une todo ─────► respuesta final al frontend
```

## Separación de responsabilidades

| Componente | Responsabilidad |
|---|---|
| **FastAPI backend** (`backend/app/services/recommender.py`) | Embedding (Bedrock Titan), kNN search (pgvector), scoring temporal, ranking |
| **Lambda Fase 3** (`script/lambda_function.py`) | Solo generación de explicaciones RAG (Bedrock Nova Lite) |

**Motivación**: Esta separación permite que un desarrollador trabaje únicamente desde `backend/` sin necesitar credenciales AWS propias ni acceso a la cuenta de producción. El Lambda solo necesita permisos de Bedrock para el LLM.

## Formula de scoring v2 (ejecutada en el backend)

La recomendación combina similitud semántica, peso temporal, tipo de contenido y cobertura:

```
chunk_score(q, c) = cosine_sim(q, c) * temporal_weight(c.year) * content_type_weight(c.type)
```

Peso temporal (decaimiento exponencial, DECAY_RATE=5):
```
temporal_weight(year) = 1.0 + RECENCY_BOOST * exp(-(MAX_YEAR - year) / DECAY_RATE)
```

Con RECENCY_BOOST=0.3:
- 2026: peso 1.30 (boost máximo)
- 2021: peso 1.16
- 2016: peso 1.04
- 2010: peso 1.01
- 1997: peso ~1.00
- Sin año: peso 1.00 (chunks de perfil)

Peso por tipo de contenido:
- `thesis`: ×1.30 (evidencia directa: dirigió una tesis sobre el tema)
- `publication`: ×1.15 (evidencia indirecta: publicó sobre el tema)
- `profile`: ×1.00 (señal débil: perfil menciona el área)

Score del asesor:
```
advisor_score = mean(top_M_chunk_scores) * coverage_boost(num_relevant)
coverage_boost(n) = 1 + 0.10 * log(n + 1)
```

Filtros:
- Chunks con similitud < 0.30 son descartados (MIN_SIMILARITY)
- Se toman los mejores 10 chunks por asesor (CHUNKS_PER_ADVISOR)
- kNN recupera 200 chunks (vs 50 en v1) para mejor cobertura de asesores

**Justificación**: El decaimiento exponencial diferencia mucho más los últimos 5 años vs el lineal original. El content-type weighting premia la evidencia directa (tesis dirigidas) sobre señales débiles (perfiles). El coverage boost da un bonus logarítmico a asesores con más evidencia relevante sin que dominen por volumen.

## Estructura

```
3-advisor-recommend/
├── script/
│   ├── requirements.txt
│   ├── config.py            # Configuración centralizada (.env)
│   ├── db_client.py         # Cliente pgvector (uso local/CLI únicamente)
│   ├── embedder.py          # Bedrock Titan v2 (uso local/CLI únicamente)
│   ├── recommender.py       # Scoring y ranking (uso local/CLI únicamente)
│   ├── explainer.py         # RAG: explicación via Nova Lite (por ahora)
│   ├── lambda_function.py   # Handler Lambda (solo RAG)
│   ├── main.py              # CLI principal (pipeline completo local)
│   └── .env.example
├── prompts/
│   └── recommendation.txt   # Template para explicaciones RAG
├── terraform/
│   ├── main.tf              # Lambda + IAM user BackendInvoker (Lambda + Bedrock)
│   ├── variables.tf
│   └── terraform.tfvars
└── README.md
```

## Integración con el Backend FastAPI

La lógica de embedding, kNN y scoring vive en `backend/app/services/recommender.py`.
El router `backend/app/routers/recommendation.py` orquesta el pipeline completo.

Las credenciales del IAM user `BackendInvoker` (generadas por Terraform) dan acceso tanto a `lambda:InvokeFunction` como a `bedrock:InvokeModel` y se configuran en el `.env` del backend:

```env
ADVISOR_LAMBDA_ACCESS_KEY_ID=...   # terraform output backend_invoker_access_key_id
ADVISOR_LAMBDA_SECRET_ACCESS_KEY=... # terraform output -raw backend_invoker_secret_access_key
ADVISOR_LAMBDA_FUNCTION=phase3_advisor_recommend
ADVISOR_LAMBDA_REGION=us-east-2

# Parámetros del motor (opcionales, tienen defaults)
EMBEDDING_MODEL=amazon.titan-embed-text-v2:0
EMBEDDING_DIMENSIONS=1024
TOP_K=5
KNN_LIMIT=50
RECENCY_BOOST=0.3
```

## Contrato del Lambda

### Payload de entrada

```json
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
          "content_text": "Clasificación automática de...",
          "similarity": 0.92,
          "chunk_score": 1.12,
          "year": 2024
        }
      ]
    }
  ],
  "no_explain": false
}
```

### Respuesta del Lambda

```json
{
  "statusCode": 200,
  "body": {
    "explanations": {
      "abc123": "Este asesor es recomendado porque...",
      "def456": "Su experiencia en..."
    },
    "elapsed_seconds": 3.1
  }
}
```

## Formato de respuesta final (POST /recommendations en FastAPI)

```json
{
  "query": "Aplicacion de NLP para clasificar documentos legales",
  "top_k": 5,
  "knn_limit": 50,
  "elapsed_seconds": 6.2,
  "recommendations": [
    {
      "rank": 1,
      "advisor_id": "abc123",
      "advisor_name": "Rodriguez Rodriguez, Ciro",
      "score": 0.87,
      "orcid": "0000-0001-...",
      "thesis_count": 12,
      "num_matching_chunks": 8,
      "explanation": "Este asesor es recomendado porque...",
      "matching_evidence": [
        {
          "content_type": "thesis",
          "content_text": "Clasificacion automatica de...",
          "similarity": 0.92,
          "chunk_score": 1.12,
          "year": 2024
        }
      ]
    }
  ]
}
```

## Uso local del CLI (sin Lambda, sin backend)

Requiere Docker (`db/`) corriendo con datos cargados.

```bash
cd script/
pip install -r requirements.txt
cp .env.example .env

# Login AWS (para Bedrock)
aws sso login --profile " "

# Recomendación completa (con explicaciones RAG)
python main.py --idea "Aplicacion de NLP para clasificar documentos legales"

# Solo scoring (sin llamada al LLM)
python main.py --idea "Sistema de ML para deteccion de fraudes" --no-explain

# Output JSON
python main.py --idea "..." --output json

# Parámetros
python main.py --idea "..." --top-k 3 --knn-limit 100
```

## Deploy del Lambda

```bash
cd terraform/

bash build.sh

terraform apply

terraform output backend_invoker_access_key_id
terraform output -raw backend_invoker_secret_access_key
```

## Variables de entorno del Lambda

| Variable | Descripción |
|---|---|
| `MODE` | `cloud` (fijado en Terraform) |
| `LLM_MODEL` | Modelo para explicaciones RAG (default: `us.amazon.nova-lite-v1:0`) |

> El Lambda no necesita variables de DB, embedding ni scoring — esas las maneja el backend.

## Parámetros CLI (uso local)

| Argumento | Default | Descripción |
|---|---|---|
| `--idea` | (requerido) | Idea de tesis del estudiante |
| `--top-k` | 5 | Cantidad de asesores a recomendar |
| `--knn-limit` | 200 | Chunks kNN a recuperar de pgvector |
| `--no-explain` | false | Omite la generación de explicaciones RAG |
| `--output` | text | Formato: `text` o `json` |

## Evaluación offline (backend)

El backend incluye un evaluador de calidad del motor que usa métricas intrínsecas (sin feedback de usuarios). Costo: ~$0.001 por ejecución.

### Endpoints

| Endpoint | Descripción |
|---|---|
| `POST /evaluate` | Evaluación completa: 25 queries + test de estabilidad |
| `POST /evaluate/quick` | Evaluación rápida: 5 queries |
| `POST /evaluate/compare` | Debug: ranking detallado de una query |

### Métricas calculadas

| Métrica | Qué mide |
|---|---|
| Score separation | Diferenciación entre top y resto |
| Score gap top-2 | Confianza en el #1 recomendado |
| Evidence coverage | Diversidad de tipos (thesis/pub/profile) |
| Advisor diversity | Que los recomendados no sean del mismo nicho |
| Ranking stability (τ) | Consistencia ante paráfrasis de la misma idea |

### Ejemplo de uso

```bash
# Evaluación completa con detalle
curl -X POST http://localhost:8000/evaluate \
  -H "Content-Type: application/json" \
  -d '{"include_detail": true}'

# Evaluación rápida
curl -X POST http://localhost:8000/evaluate/quick

# Debug de una query
curl -X POST http://localhost:8000/evaluate/compare \
  -H "Content-Type: application/json" \
  -d '{"query": "Sistema de NLP para clasificar documentos legales"}'
```
