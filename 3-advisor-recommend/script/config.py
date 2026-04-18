"""
Configuracion centralizada del motor de recomendacion.

Carga valores desde .env y expone como constantes.
"""

import os
from dotenv import load_dotenv

load_dotenv()

MODE = os.getenv("MODE", "local")

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", "5433")),
    "dbname": os.getenv("DB_NAME", "advisors_db"),
    "user": os.getenv("DB_USER", "advisor_user"),
    "password": os.getenv("DB_PASSWORD", "advisor_local_pass"),
}

AWS_REGION = os.getenv("AWS_REGION", "us-east-2")
AWS_PROFILE = os.getenv("AWS_PROFILE", "Ecomm-Seba")

# modelo de embeddings
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "amazon.titan-embed-text-v2:0")
EMBEDDING_DIMENSIONS = int(os.getenv("EMBEDDING_DIMENSIONS", "1024"))

# modelo de lenguaje (para lo de explicaciones RAG)
LLM_MODEL = os.getenv("LLM_MODEL", "us.amazon.nova-lite-v1:0")

# params de recomendacion
TOP_K = int(os.getenv("TOP_K", "5"))
RECENCY_BOOST = float(os.getenv("RECENCY_BOOST", "0.3"))
CHUNKS_PER_ADVISOR = int(os.getenv("CHUNKS_PER_ADVISOR", "10"))
KNN_LIMIT = int(os.getenv("KNN_LIMIT", "50"))

# rango temporal (se ajusta con los datos reales en runtime)
MIN_YEAR = 1997
MAX_YEAR = 2026
