"""Pydantic schemas para tesis."""

from typing import Optional
from pydantic import BaseModel


class ThesisListItem(BaseModel):
    id: str
    title: str
    author: Optional[str] = None
    year: Optional[int] = None
    advisor_name: Optional[str] = None
    advisor_id: Optional[str] = None
    degree_level: Optional[str] = None
    degree_name: Optional[str] = None


class ThesisRead(ThesisListItem):
    abstract: Optional[str] = None
    subjects: Optional[list[str]] = None
    subject_ocde: Optional[list[str]] = None
    thesis_type: Optional[str] = None
    degree_name: Optional[str] = None
    degree_discipline: Optional[str] = None
    degree_grantor: Optional[str] = None
    citation: Optional[str] = None
    handle_url: Optional[str] = None
    language: Optional[str] = None
    jurors: Optional[list[str]] = None
