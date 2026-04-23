"""Router de procesamiento de perfil: POST /process-profile (migrado de test.py)."""

import json
import uuid

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from app.models.student import Student
from app.services.aws import (
    clean_lambda_response,
    get_lambda_client,
    get_s3_client,
    upload_to_s3,
)
from app.services.auth import hash_password
from app.config import get_settings
from app.database import engine
from sqlmodel import Session, select
from sqlalchemy.exc import IntegrityError

router = APIRouter(tags=["profile"])
settings = get_settings()


def _insert_student(body: dict, email: str, password: str) -> str:
    """Persiste el perfil del estudiante en la tabla students via SQLModel."""
    pdf_urls   = body.get("pdf_urls", {})
    historial  = body.get("historial", {})
    estudiante = historial.get("estudiante", {})
    resumen    = historial.get("resumen_creditos", {})
    periodos   = historial.get("periodos_academicos", [])
    cv_text    = body.get("cv", {}).get("cv_text")

    student = Student(
        id=uuid.uuid4(),
        email=email,
        password_hash=hash_password(password),
        codigo_matricula=estudiante.get("codigo_matricula", ""),
        nombres_apellidos=estudiante.get("nombres_apellidos", ""),
        facultad=estudiante.get("facultad"),
        escuela=estudiante.get("escuela"),
        plan=estudiante.get("plan"),
        pdf_url_historial=pdf_urls.get("historial"),
        pdf_url_matricula=pdf_urls.get("matricula"),
        pdf_url_cv=pdf_urls.get("cv"),
        periodos_academicos=periodos,
        cv_text=cv_text,
        creditaje_requerido_para_egresar=_int(resumen.get("creditaje_requerido_para_egresar")),
        creditaje_aprobado=_int(resumen.get("creditaje_aprobado")),
        obligatorios=_int(resumen.get("obligatorios")),
        de_especialidad=_int(resumen.get("de_especialidad")),
        electivos_generales=_int(resumen.get("electivos_generales")),
        electivos_de_especialidad=_int(resumen.get("electivos_de_especialidad")),
        optativos=_int(resumen.get("optativos")),
        alternativos=_int(resumen.get("alternativos")),
        de_otra_especialidad=_int(resumen.get("de_otra_especialidad")),
        mas_de_una_vez=_int(resumen.get("mas_de_una_vez")),
        otros=_int(resumen.get("otros")),
        creditaje_faltante=_int(resumen.get("creditaje_faltante")),
        promedio_ponderado=resumen.get("promedio_ponderado"),
    )

    student_id = str(student.id)  # capturado antes de abrir la sesion — es un UUID de Python puro

    with Session(engine) as session:
        # Verifica duplicado de email antes de insertar
        existing = session.exec(
            select(Student).where(Student.email == email)
        ).first()
        if existing:
            raise HTTPException(
                status_code=409,
                detail="Ya existe un estudiante registrado con ese email",
            )
        try:
            session.add(student)
            session.commit()
            # student_id ya esta capturado arriba como str — no acceder a student.id aqui
        except IntegrityError as exc:
            session.rollback()
            raise HTTPException(
                status_code=409,
                detail=f"Registro duplicado: {exc.orig}",
            ) from exc

    return student_id


def _int(value) -> int | None:
    """Convierte un float a int truncando, o retorna None."""
    if value is None:
        return None
    return int(value)


@router.post("/process-profile", status_code=201)
async def process_profile(
    email: str = Form(...),
    password: str = Form(...),
    historial: UploadFile = File(...),
    matricula: UploadFile | None = File(None),
    cv: UploadFile | None = File(None),
):
    """
    1. Sube los PDFs a S3.
    2. Invoca la Lambda StudentProfileReader.
    3. Persiste el perfil en la tabla students via SQLModel.
    4. Retorna el perfil estructurado + student_id.
    """
    request_id = uuid.uuid4().hex[:8]
    prefix = f"uploads/{request_id}"

    s3 = get_s3_client()
    lmb = get_lambda_client()

    payload: dict = {}

    historial_key = await upload_to_s3(s3, historial, prefix)
    payload["historial_key"] = historial_key

    if matricula and matricula.filename:
        payload["matricula_key"] = await upload_to_s3(s3, matricula, prefix)

    if cv and cv.filename:
        payload["cv_key"] = await upload_to_s3(s3, cv, prefix)

    lambda_response = lmb.invoke(
        FunctionName=settings.lambda_function,
        InvocationType="RequestResponse",
        Payload=json.dumps(payload),
    )
    response_payload = json.loads(lambda_response["Payload"].read())

    status_code = response_payload.get("statusCode", 200)
    body = clean_lambda_response(response_payload.get("body", "{}"))

    if status_code != 200:
        return JSONResponse(content=body, status_code=status_code)

    student_id = _insert_student(body, email, password)

    return JSONResponse(
        content={**body, "student_id": student_id},
        status_code=201,
    )
