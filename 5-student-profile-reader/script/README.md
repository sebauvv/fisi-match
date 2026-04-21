# Student Profile Reader (Fase 5)

Procesamiento de PDFs academicos de la UNMSM para generar un perfil JSON estructurado del estudiante. Soporta historial academico y reporte de matricula (pdfplumber) y CV (Bedrock Nova Lite).

## Estructura

```
5-student-profile-reader/
  script/
    main.py                        Punto de entrada local (CLI)
    lambda_function.py             Handler AWS Lambda
    parsers/
      historial_parser.py          Extrae datos del historial academico
      matricula_parser.py          Extrae datos del reporte de matricula
      cv_parser.py                 Extrae habilidades/experiencia del CV con LLM
    examples/                      PDFs de ejemplo
    output/                        Salida JSON (generada automaticamente)
    requirements.txt
  terraform/
    main.tf                        Lambda, IAM, S3, IAM user
    variables.tf
    build.sh                       Empaqueta lambda.zip
  prompts/
    prompt.txt                     Prompt para extraccion de CV
```

## Uso local (CLI)

```bash
cd 5-student-profile-reader/script
source .venv/bin/activate
pip install -r requirements.txt

# Solo historial academico (salida por terminal)
python main.py --mode tabla --historial examples/historial-academico.pdf

# Historial + reporte de matricula (guarda en /output)
python main.py --mode tabla --historial examples/historial-academico.pdf --matricula examples/reporte_matricula.pdf --output
```

## Despliegue Lambda

```bash
# 1. Login SSO
aws sso login --profile "*"

# 2. Build + Terraform
cd 5-student-profile-reader/terraform
bash build.sh          # genera lambda.zip + terraform plan
terraform apply        # despliega

# 3. Credenciales del S3 user para pasarlas a un .env
terraform output s3_user_access_key_id
terraform output -raw s3_user_secret_access_key

# 4. Se ponen estas en backend/.env
# S3_ACCESS_KEY_ID=<access_key>
# S3_SECRET_ACCESS_KEY=<secret_key>
# S3_BUCKET=student-profile-pdfs-unmsm
# LAMBDA_FUNCTION=StudentProfileReader
# AWS_REGION=us-east-2
# AWS_PROFILE=" "
```

## API de prueba (FastAPI)

```bash
cd backend
source .venv/bin/activate
pip install -r requirements.txt
uvicorn test:app --reload --port 8000
```

```bash
# test rapido con curl de un POST con historial + matricula + cv
curl -X POST http://localhost:8000/process-profile \
  -F "historial=@../5-student-profile-reader/script/examples/historial-academico.pdf" \
  -F "matricula=@../5-student-profile-reader/script/examples/reporte_matricula.pdf" \
  -F "cv=@../5-student-profile-reader/script/examples/SebastianCastillo_CV.pdf"
```

## Procesamiento

### Historial academico (pdfplumber)

Extrae datos del estudiante, cursos por periodo con calificaciones, y resumen de creditos aprobados.

### Reporte de matricula (pdfplumber, opcional)

Agrega cursos del periodo vigente con `calificacion: "En progreso"`.

### CV (Bedrock Nova Lite, opcional)

Extrae habilidades tecnicas, experiencia laboral y proyectos del estudiante usando un LLM. El prompt esta en `prompts/prompt.txt`.

## Consideraciones tecnicas

- `pdfplumber` es puro Python, compatible con Lambda sin binarios del sistema.
- Los parsers son modulos independientes importables desde `main.py` (local) y `lambda_function.py` (cloud).
- Las tablas que cruzan paginas se manejan detectando la presencia/ausencia de la fila de encabezado.
- La Lambda descarga los PDFs de S3, los procesa, y retorna JSON con URLs publicas de los PDFs almacenados.
