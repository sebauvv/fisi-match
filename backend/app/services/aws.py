"""Servicio AWS: clientes S3 y Lambda, subida de PDFs."""

import json

import boto3
from fastapi import UploadFile

from app.config import get_settings

settings = get_settings()


def get_s3_client():
    """Crea cliente S3 usando credenciales IAM del .env."""
    if settings.s3_access_key_id and settings.s3_secret_access_key:
        return boto3.client(
            "s3",
            region_name=settings.aws_region,
            aws_access_key_id=settings.s3_access_key_id,
            aws_secret_access_key=settings.s3_secret_access_key,
        )
    session = boto3.Session(
        profile_name=settings.aws_profile,
        region_name=settings.aws_region,
    )
    return session.client("s3")


def get_lambda_client():
    """
    Crea cliente Lambda usando credenciales IAM del .env.
    No usa perfil SSO — funciona tanto en local como en produccion.
    Si no hay access key configurada, boto3 usa la cadena de credenciales
    por defecto (variables de entorno, IAM instance role, etc.).
    """
    if settings.s3_access_key_id and settings.s3_secret_access_key:
        return boto3.client(
            "lambda",
            region_name=settings.aws_region,
            aws_access_key_id=settings.s3_access_key_id,
            aws_secret_access_key=settings.s3_secret_access_key,
        )
    return boto3.client("lambda", region_name=settings.aws_region)


def get_advisor_lambda_client():
    """
    Crea cliente Lambda con credenciales IAM exclusivas del usuario
    BackendInvoker generado en Terraform para el motor de recomendacion.
    Utiliza ADVISOR_LAMBDA_ACCESS_KEY_ID / ADVISOR_LAMBDA_SECRET_ACCESS_KEY del .env.
    """
    if settings.advisor_lambda_access_key_id and settings.advisor_lambda_secret_access_key:
        return boto3.client(
            "lambda",
            region_name=settings.advisor_lambda_region,
            aws_access_key_id=settings.advisor_lambda_access_key_id,
            aws_secret_access_key=settings.advisor_lambda_secret_access_key,
        )
    # Fallback: usa la cadena de credenciales por defecto de boto3
    return boto3.client("lambda", region_name=settings.advisor_lambda_region)



async def upload_to_s3(s3_client, file: UploadFile, prefix: str) -> str:
    """Sube un archivo a S3 y retorna la key generada."""
    content = await file.read()
    key = f"{prefix}/{file.filename}"
    s3_client.put_object(
        Bucket=settings.s3_bucket,
        Key=key,
        Body=content,
        ContentType="application/pdf",
    )
    return key


def clean_lambda_response(raw: str | dict) -> dict:
    """Normaliza la respuesta de Lambda (string JSON o dict)."""
    if isinstance(raw, str):
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return {"raw": raw}
    return raw
