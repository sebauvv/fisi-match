# Fase 3: Motor de Recomendacion de Asesores

Motor RAG (Retrieval-Augmented Generation) que recomienda asesores de tesis a partir de la idea del estudiante. Busca entre todos los fragmentos de conocimiento (tesis, publicaciones, perfiles) y recomienda personas, no vectores individuales.

## Arquitectura

```
Idea del estudiante (texto)
    |
    v
Bedrock Titan v2 --> embedding (1024d)
    |
    v
pgvector kNN --> top-50 chunks similares
    |
    v
Scoring (similitud * peso temporal) --> agrupa por asesor
    |
    v
Top-K asesores rankeados
    |
    v
Nova Lite (RAG) --> explicacion con evidencia
    |
    v
Resultado: asesores + scores + justificaciones
```

## Formula de scoring

La recomendacion combina similitud semantica con peso temporal:

```
chunk_score(q, c) = cosine_sim(q, c) * temporal_weight(c.year)
```

Peso temporal (boost lineal a publicaciones recientes):
```
temporal_weight(year) = 1.0 + RECENCY_BOOST * ((year - MIN_YEAR) / (MAX_YEAR - MIN_YEAR))
```

Con RECENCY_BOOST=0.3 y rango 1997-2026:
- 2026: peso 1.30 (boost maximo, 30%)
- 2020: peso 1.24
- 2010: peso 1.13
- 1997: peso 1.00 (sin boost, pero no penalizado)
- Sin año: peso 1.00 (chunks de perfil)

Score del asesor:
```
advisor_score = mean(top_K_chunk_scores)
```

Se toman los mejores 10 chunks por asesor (CHUNKS_PER_ADVISOR) para evitar que asesores con alto volumen de publicaciones tengan ventaja por cantidad.

**Justificacion**: La combinacion lineal es interpretable y reproducible. El boost temporal no penaliza trabajos antiguos (piso 1.0) sino que premia actividad reciente. Esto favorece a asesores activos sin descartar a los de trayectoria larga.

## Estructura

```
3-advisor-recommend/
├── script/
│   ├── requirements.txt
│   ├── config.py            # Configuracion centralizada (.env)
│   ├── db_client.py          # Conexion pgvector, queries kNN
│   ├── embedder.py           # Bedrock Titan v2 (embedding de la idea)
│   ├── recommender.py        # Scoring y ranking de asesores
│   ├── explainer.py          # RAG: explicacion via Nova Lite
│   ├── main.py               # CLI principal
│   └── .env.example
├── prompts/
│   └── recommendation.txt    # Template para explicaciones RAG
├── infrastructure/
│   └── terraform/            # Lambda + IAM (modo cloud)
│       ├── main.tf
│       └── variables.tf
└── README.md
```

## Uso local

Requiere Docker (db/) corriendo con datos cargados.

```bash
cd script/
pip install -r requirements.txt
cp .env.example .env

# Login AWS (para Bedrock)
aws sso login --profile Ecomm-Seba

# Recomendacion completa (con explicaciones RAG)
python main.py --idea "Aplicacion de NLP para clasificar documentos legales"

# Solo scoring (sin llamada al LLM)
python main.py --idea "Sistema de ML para deteccion de fraudes" --no-explain

# Output JSON (para integracion)
python main.py --idea "..." --output json

# Personalizar parametros
python main.py --idea "..." --top-k 3 --knn-limit 100
```

## Parametros CLI

| Argumento | Default | Descripcion |
|---|---|---|
| `--idea` | (requerido) | Idea de tesis del estudiante |
| `--top-k` | 5 | Cantidad de asesores a recomendar |
| `--knn-limit` | 50 | Chunks kNN a recuperar de pgvector |
| `--no-explain` | false | Omite la generacion de explicaciones RAG |
| `--output` | text | Formato: `text` o `json` |

## Parametros de entrada Lambda (documentados para futuro API Gateway)

```json
{
  "thesis_idea": "Aplicacion de NLP para clasificar documentos legales",
  "top_k": 5,
  "knn_limit": 50
}
```

## Formato de respuesta

```json
{
  "query": "Aplicacion de NLP para...",
  "top_k": 5,
  "elapsed_seconds": 4.2,
  "recommendations": [
    {
      "rank": 1,
      "advisor_id": "abc123",
      "advisor_name": "Rodriguez Rodriguez, Ciro",
      "score": 0.87,
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

## Variables de entorno (.env)

| Variable | Default | Descripcion |
|---|---|---|
| MODE | local | Modo de ejecucion |
| DB_HOST | localhost | Host de PostgreSQL |
| DB_PORT | 5433 | Puerto (5433 local, 5432 RDS) |
| AWS_REGION | us-east-2 | Region de Bedrock |
| LLM_MODEL | us.amazon.nova-lite-v1:0 | Modelo para explicaciones |
| RECENCY_BOOST | 0.3 | Boost temporal (0-1) |
| TOP_K | 5 | Asesores a recomendar |
| KNN_LIMIT | 50 | Chunks kNN a recuperar |
