"""Pydantic schemas para el estudiante: request/response bodies."""

import uuid
from typing import Any, Optional

from pydantic import BaseModel


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    student_id: str
    email: str
    nombres_apellidos: str


class StudentUpdate(BaseModel):
    """Campos que el estudiante puede editar en el paso de confirmacion."""

    nombres_apellidos: Optional[str] = None
    codigo_matricula: Optional[str] = None
    facultad: Optional[str] = None
    escuela: Optional[str] = None
    plan: Optional[str] = None
    cv_text: Optional[str] = None


class CreditsSummaryRead(BaseModel):
    creditaje_requerido_para_egresar: Optional[int] = None
    creditaje_aprobado: Optional[int] = None
    obligatorios: Optional[int] = None
    de_especialidad: Optional[int] = None
    electivos_generales: Optional[int] = None
    electivos_de_especialidad: Optional[int] = None
    optativos: Optional[int] = None
    alternativos: Optional[int] = None
    de_otra_especialidad: Optional[int] = None
    mas_de_una_vez: Optional[int] = None
    otros: Optional[int] = None
    creditaje_faltante: Optional[int] = None
    promedio_ponderado: Optional[float] = None


class StudentRead(BaseModel):
    student_id: str
    email: str
    codigo_matricula: str
    nombres_apellidos: str
    facultad: Optional[str] = None
    escuela: Optional[str] = None
    plan: Optional[str] = None
    pdf_url_historial: Optional[str] = None
    pdf_url_matricula: Optional[str] = None
    pdf_url_cv: Optional[str] = None
    periodos_academicos: Optional[Any] = None
    cv_text: Optional[str] = None
    resumen_creditos: CreditsSummaryRead

    @classmethod
    def from_orm_student(cls, s: Any) -> "StudentRead":
        return cls(
            student_id=str(s.id),
            email=s.email,
            codigo_matricula=s.codigo_matricula,
            nombres_apellidos=s.nombres_apellidos,
            facultad=s.facultad,
            escuela=s.escuela,
            plan=s.plan,
            pdf_url_historial=s.pdf_url_historial,
            pdf_url_matricula=s.pdf_url_matricula,
            pdf_url_cv=s.pdf_url_cv,
            periodos_academicos=s.periodos_academicos,
            cv_text=s.cv_text,
            resumen_creditos=CreditsSummaryRead(
                creditaje_requerido_para_egresar=s.creditaje_requerido_para_egresar,
                creditaje_aprobado=s.creditaje_aprobado,
                obligatorios=s.obligatorios,
                de_especialidad=s.de_especialidad,
                electivos_generales=s.electivos_generales,
                electivos_de_especialidad=s.electivos_de_especialidad,
                optativos=s.optativos,
                alternativos=s.alternativos,
                de_otra_especialidad=s.de_otra_especialidad,
                mas_de_una_vez=s.mas_de_una_vez,
                otros=s.otros,
                creditaje_faltante=s.creditaje_faltante,
                promedio_ponderado=s.promedio_ponderado,
            ),
        )
