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

## Formula de scoring (ejecutada en el backend)

La recomendación combina similitud semántica con peso temporal:

```
chunk_score(q, c) = cosine_sim(q, c) * temporal_weight(c.year)
```

Peso temporal (boost lineal a publicaciones recientes):
```
temporal_weight(year) = 1.0 + RECENCY_BOOST * ((year - MIN_YEAR) / (MAX_YEAR - MIN_YEAR))
```

Con RECENCY_BOOST=0.3 y rango 1997-2026:
- 2026: peso 1.30 (boost máximo, 30%)
- 2020: peso 1.24
- 2010: peso 1.13
- 1997: peso 1.00 (sin boost, pero no penalizado)
- Sin año: peso 1.00 (chunks de perfil)

Score del asesor:
```
advisor_score = mean(top_K_chunk_scores)
```

Se toman los mejores 10 chunks por asesor (CHUNKS_PER_ADVISOR) para evitar que asesores con alto volumen de publicaciones tengan ventaja por cantidad.

**Justificación**: La combinación lineal es interpretable y reproducible. El boost temporal no penaliza trabajos antiguos (piso 1.0) sino que premia actividad reciente. Esto favorece a asesores activos sin descartar a los de trayectoria larga.

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
| `--knn-limit` | 50 | Chunks kNN a recuperar de pgvector |
| `--no-explain` | false | Omite la generación de explicaciones RAG |
| `--output` | text | Formato: `text` o `json` |
