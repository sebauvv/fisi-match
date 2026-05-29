# FISI Match - API (FastAPI)

> **Motor central de servicios RESTful que gestiona la lógica de negocio, autenticación, base de datos relacional/vectorial e integración con microservicios serverless de AWS.**

---

## Stack Tecnológico

*   **Lenguaje**: Python 3.11+
*   **Framework Web**: **FastAPI** (asíncrono, generación de OpenAPI automático).
*   **Mapeo Objeto-Relacional (ORM)**: **SQLModel** (fusión perfecta entre *SQLAlchemy* y *Pydantic*).
*   **Gestor de Tareas y Conexión de AWS**: **boto3** (Cliente oficial de AWS para interactuar con S3 y Lambda).
*   **Servidor ASGI**: **Uvicorn** con hot-reload.

---

## Estructura de Directorios

```
backend/
├── app/
│   ├── main.py                 # Punto de entrada de la aplicación FastAPI
│   ├── config.py               # Gestión y validación de variables de entorno (Pydantic Settings)
│   ├── database.py             # Configuración del motor y sesión de SQLAlchemy/SQLModel
│   ├── models/                 # Modelos relacionales y esquemas de base de datos
│   │   ├── advisor.py          # Entidades de Profesores y Áreas
│   │   ├── student.py          # Datos de Estudiantes y sus Notas
│   │   ├── thesis.py           # Historial de Tesis dirigidas
│   │   ├── publication.py      # Historial de Publicaciones de profesores
│   │   └── alignment.py        # Reportes históricos de alineación
│   ├── routers/                # Enrutadores divididos por módulos funcionales
│   │   ├── auth.py             # Autenticación y registro de alumnos
│   │   ├── advisors.py         # Consulta de docentes y catálogos
│   │   ├── profile.py          # Carga e interpretación de PDF de notas/CV
│   │   ├── recommendation.py   # Recomendación kNN de asesores (Invoca Lambda Fase 3)
│   │   ├── alignment.py        # Evaluación de alineación (Invoca Lambda Fase 6)
│   │   ├── alternative_recommendations.py # Sugerencia de temas alternativos (Lambda Fase 7)
│   │   ├── theses.py           # Acceso directo a tesis históricas
│   │   ├── publications.py     # Acceso directo a publicaciones científicas
│   │   └── stats.py            # Métricas e indicadores generales
│   └── services/               # Lógica y utilidades de backend adicionales
├── requirements.txt            # Dependencias del backend
├── .env.example                # Plantilla de variables de entorno
└── test.py                     # Script experimental para API e integraciones rápidas
```

---

## Modelos de Datos (`SQLModel`)

El backend utiliza **SQLModel** para definir simultáneamente los esquemas de base de datos de PostgreSQL y las validaciones de tipo de las peticiones REST.

### Relaciones del Modelo Relacional:

```mermaid
erDiagram
    STUDENT ||--o{ ALIGNMENT_REPORT : "has"
    ADVISOR ||--o{ THESIS : "supervised"
    ADVISOR ||--o{ PUBLICATION : "authored"
    ADVISOR ||--o{ KNOWLEDGE_VECTOR : "represented by"

    STUDENT {
        uuid id PK
        string email
        string full_name
        string thesis_idea
        string cv_url
        string academic_history_url
    }

    ADVISOR {
        uuid id PK
        string name
        string orcid
        string[] research_areas
    }

    THESIS {
        uuid id PK
        uuid advisor_id FK
        string title
        string student_name
        int year
    }

    PUBLICATION {
        uuid id PK
        uuid advisor_id FK
        string title
        string venue
        int year
    }

    ALIGNMENT_REPORT {
        uuid id PK
        uuid student_id FK
        string thesis_idea
        string alignment_level
        int score_pct
        string justification
    }

    KNOWLEDGE_VECTOR {
        uuid id PK
        uuid advisor_id FK
        vector embedding "1024d HNSW"
        string content_type "profile | publication | thesis"
        string content_text
    }
```

---

## Endpoints Principales de la API

La API expone múltiples rutas modulares para consumo del cliente web y móvil:

### 1. Módulo de Autenticación (`/auth`)
*   `POST /auth/register`: Registra un nuevo estudiante en la base de datos.
*   `POST /auth/login`: Autentica al estudiante, retornando un token de sesión e información del perfil.

### 2. Módulo de Estudiantes y Perfil (`/students` & `/profile`)
*   `GET /students/me`: Obtiene los datos del estudiante autenticado.
*   `POST /profile/upload-documents`: Endpoint multiparte (`multipart/form-data`) que carga los PDFs del estudiante (Historial de Notas, Reporte de Matrícula y CV) a AWS S3 e invoca sincrónicamente la **Lambda Fase 5 (Student Profile Reader)** para extraer cursos y habilidades en un JSON estructurado.

### 3. Módulo de Asesores y Catálogo (`/advisors`)
*   `GET /advisors`: Lista todos los profesores con opciones de búsqueda, paginación y filtros por áreas de investigación o keywords.
*   `GET /advisors/{id}`: Detalle completo de un profesor, incluyendo su metadata relacional, publicaciones indexadas, tesis dirigidas e historial estadístico de asesorías.
*   `GET /advisors/stats/summary`: Retorna contadores de profesores, tesis totales y áreas para los indicadores visuales del dashboard.

### 4. Módulo de Recomendación Vectorial (`/recommendations`)
*   `POST /recommendations`: Recibe la propuesta de tesis del estudiante y de forma asíncrona:
    1. Invoca la **Lambda de Recomendación (Fase 3)** pasándole la idea.
    2. La Lambda ejecuta la búsqueda de similitud kNN (distancia coseno) en la base de datos y genera una justificación usando Claude.
    3. Retorna un ranking ordenado de asesores con su puntaje de similitud semántica y la justificación textual estructurada basada en la evidencia (tesis y papers).

### 5. Módulo de Alineación Académica (`/alignment`)
*   `POST /alignment/evaluate`: Toma la idea de tesis y el perfil parsed del estudiante (historial de notas y habilidades de su CV) e invoca la **Lambda de Alineamiento (Fase 6)**. Retorna un análisis semántico del nivel de preparación académica, fortalezas y brechas de conocimiento, persistiendo el reporte en la tabla `alignment_reports`.

### 6. Módulo de Temas Alternativos (`/alternative-recommendations`)
*   `POST /alternative-recommendations`: Si la alineación resulta baja o media, este endpoint invoca la **Lambda de Recomendaciones Alternativas (Fase 7)** para sugerir temas de tesis con menor barrera de entrada, habilidades concretas a entrenar y cursos que el alumno puede tomar para nivelarse.

---

## Configuración `.env`

Crea un archivo `.env` en la raíz del directorio `backend/` basado en la siguiente plantilla:

```env
# Configuración del Entorno
ENV=development
SECRET_KEY=un_hash_seguro_de_sesion

# Conexión a Base de Datos (Local Docker / RDS Cloud)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=advisors_db
DB_USER=advisor_user
DB_PASSWORD=advisor_pass

# Credenciales de AWS y Acceso S3/Bedrock
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
AWS_REGION=us-east-2

# Configuración de Nombres de Funciones AWS Lambda (Phases 3, 5, 6, 7)
RECOMMEND_LAMBDA_FUNCTION=AdvisorRecommender
ALIGNMENT_LAMBDA_FUNCTION=AlignmentEvaluator
PROFILE_READER_LAMBDA_FUNCTION=StudentProfileReader
ALTERNATIVE_RECOMMENDER_LAMBDA_FUNCTION=AlternativeRecommender

# S3 Bucket para almacenamiento de PDFs del estudiante
S3_BUCKET_NAME=student-profile-pdfs-unmsm
```

---

## Instrucciones para Ejecución Local

1.  **Entorno Virtual**:
    ```bash
    cd backend
    python -m venv .venv
    
    # Linux/macOS
    source .venv/bin/activate
    # Windows (PowerShell)
    .venv\Scripts\Activate.ps1
    ```

2.  **Dependencias**:
    ```bash
    pip install -r requirements.txt
    ```

3.  **Variables**:
    Se debe tener el `.env` con accesos válidos a la DB de Docker (`localhost`) y credenciales de AWS.
		
4.  **Servidor de Desarrollo**:
    ```bash
    uvicorn app.main:app --reload --port 8000
    ```