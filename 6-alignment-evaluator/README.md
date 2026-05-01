# 6 – Alignment Evaluator

Módulo de la **Fase 6** del proyecto FisiMatch.  
Evalúa el alineamiento entre el **perfil académico/profesional de un estudiante** (historial de cursos + CV) y los **requisitos inferidos** de su idea de tesis, utilizando Claude Haiku 4.5 vía AWS Bedrock.

---

## Estructura

```
6-alignment-evaluator/
├── prompts/
│   └── system_prompt.txt        # Instrucciones para el LLM (Claude Haiku 4.5)
├── script/
│   ├── main.py                  # CLI local: lee DB, llama Bedrock, guarda resultado
│   ├── lambda_function.py       # Handler Lambda: recibe datos en event, retorna JSON
│   ├── requirements.txt         # Dependencias locales (psycopg2 + boto3 + dotenv)
│   └── requirements_lambda.txt  # Dependencias Lambda (solo boto3)
└── terraform/
    ├── main.tf                  # Lambda + IAM Role (Bedrock) + IAM User (API invoker)
    ├── variables.tf
    └── build.sh                 # Empaqueta Lambda en lambda.zip
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

> **Importante:** El model ID requiere el prefijo `us.` **y** el sufijo de fecha completo (`-20251001-v1:0`). Sin el prefijo → on-demand not supported. Sin el sufijo → invalid identifier.

---

## Flujo de Datos

```
[local: main.py]           [cloud: lambda_function.py]
    │                               │
    ▼                               ▼
Lee student de DB ──►  (API envía student_data en event)
    │                               │
    └──────────────┬────────────────┘
                   ▼
         Construye prompt con:
         - thesis_idea
         - periodos_academicos (JSON)
         - cv_text
                   │
                   ▼
         Claude Haiku 4.5 (Bedrock)
                   │
                   ▼
         JSON estructurado:
         {alignment_level, score_pct, justification,
          topic_requirements, student_strengths,
          skill_gaps, relevant_courses, ...}
                   │
          ┌────────┴────────┐
          ▼                 ▼
    [local --save]    [cloud: la API lo guarda]
    INSERT INTO        INSERT INTO
    alignment_reports  alignment_reports
```

---

## Schema DB — `alignment_reports`

```sql
id                   UUID  PK
student_id           UUID  FK → students(id)
thesis_idea          TEXT  NOT NULL
alignment_level      TEXT  CHECK ('Alta'|'Media'|'Baja')
score_pct            INT   0–100
topic_requirements   TEXT  -- Requisitos inferidos del tema
student_profile_summary TEXT
justification        TEXT  NOT NULL  -- ≥300 palabras
student_strengths    TEXT  -- JSON array serializado
skill_gaps           TEXT  -- JSON array serializado
report_json          JSONB -- Respuesta completa del LLM
created_at           TIMESTAMPTZ
```

---

## Uso Local

### Prerequisitos

```bash
# 1. SSO login (credenciales para Bedrock)
aws sso login --profile " "

# 2. venv y dependencias
cd 6-alignment-evaluator/script
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# 3. .env con la DB local de Docker
cat > .env <<EOF
DB_HOST=localhost
DB_PORT=5432
DB_NAME=advisors_db
DB_USER=advisor_user
DB_PASSWORD=advisor_pass
EOF
```

### Comandos

```bash
# Ver evaluación (sin guardar en DB)
python main.py --student-id <UUID>

# Evaluar y guardar en alignment_reports
python main.py --student-id <UUID> --save

# Evaluar, guardar y exportar JSON a /output/
python main.py --student-id <UUID> --save --output
```

---

## Deploy Lambda

```bash
# 1. Para empaquetar
cd 6-alignment-evaluator/terraform
bash build.sh

# 2. Inicializar y aplicar Terraform
terraform init
terraform apply

# 3. Outputs (credenciales para la API)
terraform output -json
terraform output backend_invoker_secret_access_key
```

### Variables de entorno producidas (para el .env del backend)

```
ALIGNMENT_LAMBDA_FUNCTION=AlignmentEvaluator
ALIGNMENT_LAMBDA_REGION=us-east-2
ALIGNMENT_LAMBDA_ACCESS_KEY_ID=AKIAxxx
ALIGNMENT_LAMBDA_SECRET_ACCESS_KEY=xxx
```

### Invocación Lambda manual (prueba)

```bash
aws lambda invoke \
  --function-name AlignmentEvaluator \
  --region us-east-2 \
  --profile Ecomm-Seba \
  --cli-binary-format raw-in-base64-out \
  --payload '{
    "student_data": {
      "periodos_academicos": [...],
      "cv_text": "...",
      "thesis_idea": "Diseño de arquitectura Cloud-Native para E-commerce"
    }
  }' \
  response.json

cat response.json | python -m json.tool
```

---

## Integración Futura con la API (FastAPI)


### Endpoint a crear

```
POST /students/{student_id}/alignment
```

### Flujo esperado en el router FastAPI

```python
# backend/app/routers/alignment.py

import json, boto3
from botocore.config import Config

# 1. Obtención de datos del estudiante desde la DB
student = db.query(Student).filter(Student.id == student_id).first()

# 2. Lambda con los datos del estudiante
lambda_client = boto3.client(
    "lambda",
    region_name=settings.ALIGNMENT_LAMBDA_REGION,
    aws_access_key_id=settings.ALIGNMENT_LAMBDA_ACCESS_KEY_ID,
    aws_secret_access_key=settings.ALIGNMENT_LAMBDA_SECRET_ACCESS_KEY,
)
payload = {
    "student_data": {
        "periodos_academicos": student.periodos_academicos,
        "cv_text": student.cv_text,
        "thesis_idea": student.thesis_idea,
    }
}
response = lambda_client.invoke(
    FunctionName=settings.ALIGNMENT_LAMBDA_FUNCTION,
    InvocationType="RequestResponse",
    Payload=json.dumps(payload),
)
result = json.loads(response["Payload"].read())
report = json.loads(result["body"])

# 3. Guarda en alignment_reports
new_report = AlignmentReport(
    student_id=student_id,
    thesis_idea=student.thesis_idea,
    alignment_level=report["alignment_level"],
    score_pct=report["score_pct"],
    topic_requirements=report.get("topic_requirements"),
    student_profile_summary=report.get("student_profile_summary"),
    justification=report["justification"],
    student_strengths=json.dumps(report.get("student_strengths", [])),
    skill_gaps=json.dumps(report.get("skill_gaps", [])),
    report_json=report,
)
db.add(new_report)
db.commit()

# 4. Retorna al frontend
return new_report
```

### Variables `.env` del backend a agregar

```bash
ALIGNMENT_LAMBDA_FUNCTION=AlignmentEvaluator
ALIGNMENT_LAMBDA_REGION=us-east-2
ALIGNMENT_LAMBDA_ACCESS_KEY_ID=<output de terraform>
ALIGNMENT_LAMBDA_SECRET_ACCESS_KEY=<output de terraform>
```
