from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    # AWS
    aws_region: str = os.getenv("AWS_REGION")
    aws_profile: str = os.getenv("AWS_PROFILE","")
    s3_bucket: str = os.getenv("S3_BUCKET")
    s3_access_key_id: str = os.getenv("S3_ACCESS_KEY_ID")
    s3_secret_access_key: str = os.getenv("S3_SECRET_ACCESS_KEY")

    # Lambdas
    pdf_lambda_function: str = os.getenv("PDF_LAMBDA_FUNCTION")
    advisor_lambda_function: str = os.getenv("ADVISOR_LAMBDA_FUNCTION")
    advisor_lambda_access_key_id: str = os.getenv("ADVISOR_LAMBDA_ACCESS_KEY_ID", "")
    advisor_lambda_secret_access_key: str = os.getenv("ADVISOR_LAMBDA_SECRET_ACCESS_KEY", "")
    advisor_lambda_region: str = os.getenv("ADVISOR_LAMBDA_REGION", "us-east-2")

    alignment_lambda_function: str = os.getenv("ALIGNMENT_LAMBDA_FUNCTION", "")
    alignment_lambda_region: str = os.getenv("ALIGNMENT_LAMBDA_REGION", "us-east-2")
    alignment_lambda_access_key_id: str = os.getenv("ALIGNMENT_LAMBDA_ACCESS_KEY_ID", "")
    alignment_lambda_secret_access_key: str = os.getenv("ALIGNMENT_LAMBDA_SECRET_ACCESS_KEY", "")

    recommender_lambda_function: str = os.getenv("RECOMMENDER_LAMBDA_FUNCTION", "")
    recommender_lambda_region: str = os.getenv("RECOMMENDER_LAMBDA_REGION", "us-east-2")
    recommender_lambda_access_key_id: str = os.getenv("RECOMMENDER_LAMBDA_ACCESS_KEY_ID", "")
    recommender_lambda_secret_access_key: str = os.getenv("RECOMMENDER_LAMBDA_SECRET_ACCESS_KEY", "")

    # Bedrock Embeddings (usadas por el backend para el kNN)
    embedding_model: str = os.getenv("EMBEDDING_MODEL", "amazon.titan-embed-text-v2:0")
    embedding_dimensions: int = int(os.getenv("EMBEDDING_DIMENSIONS", "1024"))

    # Parámetros del motor de recomendación
    top_k: int = int(os.getenv("TOP_K", "5"))
    knn_limit: int = int(os.getenv("KNN_LIMIT", "200"))
    recency_boost: float = float(os.getenv("RECENCY_BOOST", "0.3"))

    # PostgreSQL
    db_host: str = os.getenv("DB_HOST")
    db_port: str = os.getenv("DB_PORT")
    db_name: str = os.getenv("DB_NAME")
    db_user: str = os.getenv("DB_USER")
    db_password: str = os.getenv("DB_PASSWORD")
    database_url: str = os.getenv("DATABASE_URL")

    # JWT
    jwt_secret: str = os.getenv("JWT_SECRET")
    jwt_algorithm: str = os.getenv("JWT_ALGORITHM")
    jwt_expire_minutes: int = os.getenv("JWT_EXPIRE_MINUTES")

    # CORS
    # cors_origins: list[str] = [
    #     "http://localhost:5173",
    #     "http://localhost:5174",
    #     "http://127.0.0.1:5173",
    #     "http://127.0.0.1:5174",
    # ]
    cors_origins: list[str] = ["*"]

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
