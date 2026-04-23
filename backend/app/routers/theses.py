"""Router de tesis: GET /theses, GET /theses/{id}."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from app.database import get_session
from app.models.thesis import Thesis
from app.schemas.thesis import ThesisListItem, ThesisRead

router = APIRouter(prefix="/theses", tags=["theses"])


@router.get("", response_model=list[ThesisListItem])
def list_theses(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    advisor_id: Optional[str] = Query(None),
    year: Optional[int] = Query(None),
    session: Session = Depends(get_session),
):
    query = select(Thesis)

    if advisor_id:
        query = query.where(Thesis.advisor_id == advisor_id)
    if year:
        query = query.where(Thesis.year == year)

    theses = session.exec(query.offset(offset).limit(limit)).all()

    return [
        ThesisListItem(
            id=t.id,
            title=t.title,
            author=t.author,
            year=t.year,
            advisor_name=t.advisor_name,
            advisor_id=t.advisor_id,
            degree_level=t.degree_level,
        )
        for t in theses
    ]


@router.get("/{thesis_id}", response_model=ThesisRead)
def get_thesis(thesis_id: str, session: Session = Depends(get_session)):
    thesis = session.get(Thesis, thesis_id)
    if not thesis:
        raise HTTPException(status_code=404, detail="Tesis no encontrada")

    return ThesisRead(
        id=thesis.id,
        title=thesis.title,
        author=thesis.author,
        year=thesis.year,
        advisor_name=thesis.advisor_name,
        advisor_id=thesis.advisor_id,
        degree_level=thesis.degree_level,
        abstract=thesis.abstract,
        subjects=thesis.subjects,
        subject_ocde=thesis.subject_ocde,
        thesis_type=thesis.thesis_type,
        degree_name=thesis.degree_name,
        degree_discipline=thesis.degree_discipline,
        degree_grantor=thesis.degree_grantor,
        citation=thesis.citation,
        handle_url=thesis.handle_url,
        language=thesis.language,
        jurors=thesis.jurors,
    )
