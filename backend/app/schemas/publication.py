"""Pydantic schemas para publicaciones externas."""

from typing import Optional
from pydantic import BaseModel


class PublicationRead(BaseModel):
    id: int
    advisor_id: Optional[str] = None
    advisor_name: Optional[str] = None
    orcid: Optional[str] = None
    title: str
    type: Optional[str] = None
    year: Optional[int] = None
    journal: Optional[str] = None
    doi: Optional[str] = None
    external_url: Optional[str] = None
