"""Pydantic schemas para asesores."""

from typing import Optional
from pydantic import BaseModel


class AdvisorListItem(BaseModel):
    id: str
    full_name: str
    research_areas: Optional[list[str]] = None
    advisor_dni: Optional[str] = None
    thesis_count: int = 0
    external_publications_count: int = 0
    orcid: Optional[str] = None


class AdvisorRead(AdvisorListItem):
    name_variants: Optional[list[str]] = None
    advisor_dni: Optional[str] = None
