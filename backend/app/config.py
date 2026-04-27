from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    # AWS
    aws_region: str = os.getenv("AWS_REGION")
    aws_profile: str = os.getenv("AWS_PROFILE")
    s3_bucket: str = os.getenv("S3_BUCKET")
    s3_access_key_id: str = os.getenv("S3_ACCESS_KEY_ID")
    s3_secret_access_key: str = os.getenv("S3_SECRET_ACCESS_KEY")

    # Lambdas
    pdf_lambda_function: str = os.getenv("PDF_LAMBDA_FUNCTION")
    advisor_lambda_function: str = os.getenv("ADVISOR_LAMBDA_FUNCTION")
    advisor_lambda_access_key_id: str = os.getenv("ADVISOR_LAMBDA_ACCESS_KEY_ID", "")
    advisor_lambda_secret_access_key: str = os.getenv("ADVISOR_LAMBDA_SECRET_ACCESS_KEY", "")
    advisor_lambda_region: str = os.getenv("ADVISOR_LAMBDA_REGION", "us-east-2")

    # PostgreSQL
    db_host: str = os.getenv("DB_HOST")
    db_port: str = os.getenv("DB_PORT")
    db_name: str = os.getenv("DB_NAME")
    db_user: str = os.getenv("DB_USER")
    db_password: str = os.getenv("DB_PASSWORD")

    # JWT
    jwt_secret: str = os.getenv("JWT_SECRET")
    jwt_algorithm: str = os.getenv("JWT_ALGORITHM")
    jwt_expire_minutes: int = os.getenv("JWT_EXPIRE_MINUTES")

    # CORS
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ]

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
