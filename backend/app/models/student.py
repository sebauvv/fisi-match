"""
Modelo ORM para la tabla students.

Nota sobre JSONB: SQLModel no incluye soporte nativo para el tipo JSONB
de PostgreSQL. Se usa sa_column con Column(JSONB) de SQLAlchemy para el
campo periodos_academicos de modo que psycopg2 lo serialice correctamente.
"""

import uuid
from datetime import datetime
from typing import Any, Optional

from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel


class Student(SQLModel, table=True):
    __tablename__ = "students"

    # Identidad y autenticacion
    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
    )
    email: str = Field(unique=True, index=True)
    password_hash: str

    # Datos del estudiante (de historial.estudiante)
    codigo_matricula: str = Field(unique=True, index=True)
    nombres_apellidos: str
    facultad: Optional[str] = None
    escuela: Optional[str] = None
    plan: Optional[str] = None

    # URLs de PDFs
    pdf_url_historial: Optional[str] = None
    pdf_url_matricula: Optional[str] = None
    pdf_url_cv: Optional[str] = None

    # Historial academico serializado (JSONB)
    periodos_academicos: Optional[Any] = Field(
        default=None,
        sa_column=Column(JSONB, nullable=False, server_default="'[]'"),
    )

    # CV en texto plano extraido por LLM
    cv_text: Optional[str] = None

    # Idea de Tesis inicial
    thesis_idea: Optional[str] = Field(default="")

    # Resumen de creditos
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

    # Timestamps
    created_at: Optional[datetime] = Field(default=None)
    updated_at: Optional[datetime] = Field(default=None)
