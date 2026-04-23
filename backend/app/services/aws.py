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
    """Crea cliente Lambda usando el profile SSO."""
    session = boto3.Session(
        profile_name=settings.aws_profile,
        region_name=settings.aws_region,
    )
    return session.client("lambda")


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
