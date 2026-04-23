"""Router de estadisticas: GET /stats."""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session, func, select

from app.database import get_session
from app.models.advisor import Advisor
from app.models.publication import ExternalPublication
from app.models.thesis import Thesis

router = APIRouter(prefix="/stats", tags=["stats"])


class StatsResponse(BaseModel):
    advisors: int
    theses: int
    publications: int
    range_start: int | None
    range_end: int | None


@router.get("", response_model=StatsResponse)
def get_stats(session: Session = Depends(get_session)):
    advisors_count = session.exec(select(func.count(Advisor.id))).one()
    theses_count = session.exec(select(func.count(Thesis.id))).one()
    pubs_count = session.exec(select(func.count(ExternalPublication.id))).one()

    year_range = session.exec(
        select(func.min(Thesis.year), func.max(Thesis.year))
    ).one()

    return StatsResponse(
        advisors=advisors_count,
        theses=theses_count,
        publications=pubs_count,
        range_start=year_range[0],
        range_end=year_range[1],
    )
