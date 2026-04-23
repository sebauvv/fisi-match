"""Router de publicaciones externas: GET /publications."""

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select

from app.database import get_session
from app.models.publication import ExternalPublication
from app.schemas.publication import PublicationRead

router = APIRouter(prefix="/publications", tags=["publications"])


@router.get("", response_model=list[PublicationRead])
def list_publications(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    advisor_id: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    year: Optional[int] = Query(None),
    session: Session = Depends(get_session),
):
    query = select(ExternalPublication)

    if advisor_id:
        query = query.where(ExternalPublication.advisor_id == advisor_id)
    if type:
        query = query.where(ExternalPublication.type == type)
    if year:
        query = query.where(ExternalPublication.year == year)

    pubs = session.exec(query.offset(offset).limit(limit)).all()

    return [
        PublicationRead(
            id=p.id,
            advisor_id=p.advisor_id,
            advisor_name=p.advisor_name,
            orcid=p.orcid,
            title=p.title,
            type=p.type,
            year=p.year,
            journal=p.journal,
            doi=p.doi,
            external_url=p.external_url,
        )
        for p in pubs
    ]
