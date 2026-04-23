"""Modelos ORM para las tablas external_publications y publication_types."""

from typing import Optional

from sqlmodel import Field, SQLModel


class PublicationType(SQLModel, table=True):
    __tablename__ = "publication_types"

    code: str = Field(primary_key=True)
    label_es: str
    pub_count: int = Field(default=0)


class ExternalPublication(SQLModel, table=True):
    __tablename__ = "external_publications"

    id: Optional[int] = Field(default=None, primary_key=True)
    advisor_id: Optional[str] = Field(
        default=None,
        foreign_key="advisors.id",
        index=True,
    )
    advisor_name: Optional[str] = None
    orcid: Optional[str] = None
    title: str
    type: Optional[str] = Field(
        default=None,
        foreign_key="publication_types.code",
        index=True,
    )
    year: Optional[int] = Field(default=None, index=True)
    journal: Optional[str] = None
    doi: Optional[str] = None
    external_url: Optional[str] = None
