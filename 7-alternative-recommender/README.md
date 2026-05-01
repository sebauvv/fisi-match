# 7 – Alternative Recommender

Toma como entrada una **evaluación de alineamiento** (output de la Fase 6) y genera recomendaciones detalladas para cerrar las brechas: habilidades a desarrollar, cursos reales, mini-proyectos y temas de tesis alternativos más accesibles al perfil actual del estudiante.

---

## Estructura

```
7-alternative-recommender/
├── prompts/
│   └── system_prompt.txt        # Instrucciones para el LLM
├── script/
│   ├── main.py                  # CLI local: lee alignment_report de DB, llama Bedrock
│   ├── lambda_function.py       # Handler Lambda: recibe report_json en event
│   ├── requirements.txt         # Dependencias locales (psycopg2 + boto3 + dotenv)
│   └── requirements_lambda.txt  # Dependencias Lambda (solo boto3)
└── terraform/
    ├── main.tf                  # Lambda + IAM Role (Bedrock) + IAM User (API invoker)
    ├── variables.tf
    └── build.sh
```

---

## Modelo LLM

| Campo | Valor |
|-------|-------|
| Proveedor | AWS Bedrock |
| Modelo | Claude Haiku 4.5 |
| Model ID | `us.anthropic.claude-haiku-4-5-20251001-v1:0` |
| Región | `us-east-2` |
| Invocación | Cross-region Inference Profile (`us.` prefix obligatorio) |

---

## Flujo de Datos

```
[local: main.py]           [cloud: lambda_function.py]
    │                               │
    ▼                               ▼
Lee alignment_report    (API envía alignment_report en event)
de DB (el más reciente) 
    │                               │
    └──────────────┬────────────────┘
                   ▼
         Claude Haiku 4.5 analiza el report_json
         de la Fase 6
                   │
                   ▼
         JSON de recomendaciones:
         {summary, skill_gaps_to_close,
          recommended_courses, mini_projects,
          alternative_topics}
                   │
          ┌────────┴────────┐
          ▼                 ▼
    [local]           [cloud API]
    Imprime JSON      retorna al frontend
    o guarda --output (NO guarda en DB por ahora)
```

> **Nota:** Esta fase **no guarda en DB**. El resultado es retornado directamente al frontend. Si en el futuro se necesita persistencia, se puede crear una tabla `recommendation_reports` siguiendo el mismo patrón de `alignment_reports`.

---

## Dependencia con Fase 6

Esta fase **depende del output de la Fase 6**. El JSON de entrada debe tener la estructura producida por el evaluador:

```json
{
  "alignment_level": "Media",
  "score_pct": 55,
  "topic_requirements": "...",
  "student_profile_summary": "...",
  "justification": "...",
  "student_strengths": ["..."],
  "skill_gaps": ["..."],
  "relevant_courses": [{"name": "...", "relevance": "..."}],
  "relevant_cv_skills": ["..."]
}
```

---

## Uso Local

### Prerequisitos

```bash
# 1. SSO login
aws sso login --profile " "

# 2. Venv con dependencias
cd 7-alternative-recommender/script
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# 3. .env con DB local
cat > .env <<EOF
DB_HOST=localhost
DB_PORT=5432
DB_NAME=advisors_db
DB_USER=advisor_user
DB_PASSWORD=advisor_pass
EOF
```

> Requiere que el estudiante ya tenga al menos un `alignment_report` generado por la Fase 6 (`python main.py --save`).

### Comandos

```bash
# Usa el alignment_report más reciente del estudiante
python main.py --student-id <UUID>

# Usa un report específico
python main.py --student-id <UUID> --report-id <UUID_REPORT>

# Guarda JSON en /output/
python main.py --student-id <UUID> --output
```

---

## Deploy Lambda

```bash
cd 7-alternative-recommender/terraform
bash build.sh
terraform init
terraform apply

# Credenciales para la API
terraform output -json
terraform output backend_invoker_secret_access_key
```

### Variables de entorno producidas

```
RECOMMENDER_LAMBDA_FUNCTION=AlternativeRecommender
RECOMMENDER_LAMBDA_REGION=us-east-2
RECOMMENDER_LAMBDA_ACCESS_KEY_ID=<output terraform>
RECOMMENDER_LAMBDA_SECRET_ACCESS_KEY=<output terraform>
```

### Invocación Lambda manual (prueba)

```bash
# El payload es el report_json guardado en alignment_reports
REPORT_JSON=$(docker compose -f ../../db/docker-compose.yml exec -T postgres \
  psql -U advisor_user -d advisors_db -t -A \
  -c "SELECT report_json FROM alignment_reports WHERE student_id='<UUID>' ORDER BY created_at DESC LIMIT 1")

aws lambda invoke \
  --function-name AlternativeRecommender \
  --region us-east-2 \
  --profile Ecomm-Seba \
  --cli-binary-format raw-in-base64-out \
  --payload "{\"alignment_report\": $REPORT_JSON}" \
  response.json

cat response.json | python -m json.tool
```

---

## Integración Futura con la API (FastAPI)

### Endpoint a crear

```
POST /students/{student_id}/recommendations
GET  /students/{student_id}/recommendations          # (si se decide persistir)
```

### Flujo esperado en el router FastAPI

```python
# backend/app/routers/recommendations.py

import json, boto3

# 1. Para obtener el alignment_report más reciente del estudiante
#    (o el especificado por query param ?report_id=...)
report = db.query(AlignmentReport)\
    .filter(AlignmentReport.student_id == student_id)\
    .order_by(AlignmentReport.created_at.desc())\
    .first()

if not report:
    raise HTTPException(404, "No alignment report found. Run Phase 6 first.")

# 2. Lambda con el report_json
lambda_client = boto3.client(
    "lambda",
    region_name=settings.RECOMMENDER_LAMBDA_REGION,
    aws_access_key_id=settings.RECOMMENDER_LAMBDA_ACCESS_KEY_ID,
    aws_secret_access_key=settings.RECOMMENDER_LAMBDA_SECRET_ACCESS_KEY,
)
response = lambda_client.invoke(
    FunctionName=settings.RECOMMENDER_LAMBDA_FUNCTION,
    InvocationType="RequestResponse",
    Payload=json.dumps({"alignment_report": report.report_json}),
)
result = json.loads(response["Payload"].read())
recommendations = json.loads(result["body"])

# 3. Retorna directamente (sin guardar en la DB por ahora)
return recommendations
```

### Orden de ejecución con la Fase 6

```
POST /students/{id}/alignment      → Fase 6: evalúa, guarda en DB, retorna report
POST /students/{id}/recommendations → Fase 7: lee ese report, llama Lambda, retorna recomendaciones
```

### Variables `.env` del backend a agregar

```bash
RECOMMENDER_LAMBDA_FUNCTION=AlternativeRecommender
RECOMMENDER_LAMBDA_REGION=us-east-2
RECOMMENDER_LAMBDA_ACCESS_KEY_ID=<output de terraform>
RECOMMENDER_LAMBDA_SECRET_ACCESS_KEY=<output de terraform>
```
