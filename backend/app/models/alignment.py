"""
Modelo ORM para la tabla alignment_reports.
"""

import uuid
from datetime import datetime
from typing import Any, Optional

from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel, text


class AlignmentReport(SQLModel, table=True):
    __tablename__ = "alignment_reports"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
    )
    student_id: uuid.UUID = Field(foreign_key="students.id", index=True)
    thesis_idea: str
    
    # Clasificacion LLM
    alignment_level: str
    score_pct: int
    
    # Narrativas clave (aplanadas para generacion rapida de PDF)
    topic_requirements: Optional[str] = None
    student_profile_summary: Optional[str] = None
    justification: str
    student_strengths: Optional[str] = None
    skill_gaps: Optional[str] = None
    
    # Respuesta JSON completa del LLM
    report_json: Any = Field(
        sa_column=Column(JSONB, nullable=False)
    )
    
    created_at: Optional[datetime] = Field(
        default_factory=datetime.utcnow,
        sa_column_kwargs={"server_default": text("now()")}
    )
