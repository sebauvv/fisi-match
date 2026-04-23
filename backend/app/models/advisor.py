"""Modelos ORM para las tablas advisors y research_areas."""

from datetime import datetime
from typing import Optional

from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import ARRAY, TEXT
from sqlmodel import Field, SQLModel


class Advisor(SQLModel, table=True):
    __tablename__ = "advisors"

    id: str = Field(primary_key=True)
    full_name: str
    name_variants: Optional[list[str]] = Field(
        default=None,
        sa_column=Column(ARRAY(TEXT)),
    )
    thesis_count: int = Field(default=0)
    orcid: Optional[str] = None
    advisor_dni: Optional[str] = None
    research_areas: Optional[list[str]] = Field(
        default=None,
        sa_column=Column(ARRAY(TEXT)),
    )
    scraped_at: Optional[datetime] = None
    external_publications_count: int = Field(default=0)


class ResearchArea(SQLModel, table=True):
    __tablename__ = "research_areas"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True)
    advisor_count: int = Field(default=0)
