from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from typing import Any

from app.database import get_session
from app.models.advisor import ResearchArea
from app.models.publication import PublicationType
from app.models.thesis import ThesisSubject
from app.schemas.metadata import PublicationTypeRead, ResearchAreaRead, ThesisSubjectRead

router = APIRouter(prefix="/metadata", tags=["metadata"])

@router.get("/publication-types", response_model=list[PublicationTypeRead])
def get_publication_types(session: Session = Depends(get_session)) -> Any:
    return session.exec(select(PublicationType)).all()

@router.get("/research-areas", response_model=list[ResearchAreaRead])
def get_research_areas(
    starts_with: str = None,
    search: str = None,
    session: Session = Depends(get_session)
) -> Any:
    query = select(ResearchArea)
    if starts_with:
        query = query.where(ResearchArea.name.ilike(f"{starts_with}%"))
    if search:
        query = query.where(ResearchArea.name.ilike(f"%{search}%"))
    query = query.order_by(ResearchArea.name)
    return session.exec(query).all()

@router.get("/thesis-subjects", response_model=list[ThesisSubjectRead])
def get_thesis_subjects(session: Session = Depends(get_session)) -> Any:
    return session.exec(select(ThesisSubject)).all()
