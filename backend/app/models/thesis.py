"""Modelo ORM para la tabla theses."""

from typing import Optional

from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import ARRAY, TEXT
from sqlmodel import Field, SQLModel


class Thesis(SQLModel, table=True):
    __tablename__ = "theses"

    id: str = Field(primary_key=True)
    title: str
    abstract: Optional[str] = None
    author: Optional[str] = None
    date_issued: Optional[str] = None
    year: Optional[int] = None
    subjects: Optional[list[str]] = Field(
        default=None,
        sa_column=Column(ARRAY(TEXT)),
    )
    subject_ocde: Optional[list[str]] = Field(
        default=None,
        sa_column=Column(ARRAY(TEXT)),
    )
    thesis_type: Optional[str] = None
    degree_level: Optional[str] = None
    degree_name: Optional[str] = None
    degree_discipline: Optional[str] = None
    degree_grantor: Optional[str] = None
    citation: Optional[str] = None
    handle_url: Optional[str] = None
    language: Optional[str] = None
    jurors: Optional[list[str]] = Field(
        default=None,
        sa_column=Column(ARRAY(TEXT)),
    )
    advisor_id: Optional[str] = Field(
        default=None,
        foreign_key="advisors.id",
        index=True,
    )
    advisor_name: Optional[str] = None


class ThesisSubject(SQLModel, table=True):
    __tablename__ = "thesis_subjects"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True)
    thesis_count: int = Field(default=0)
