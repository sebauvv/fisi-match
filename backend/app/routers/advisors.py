"""Router de asesores: GET /advisors, GET /advisors/{id}."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from app.database import get_session
from app.models.advisor import Advisor
from app.schemas.advisor import AdvisorListItem, AdvisorRead

router = APIRouter(prefix="/advisors", tags=["advisors"])


@router.get("", response_model=list[AdvisorListItem])
def list_advisors(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    research_area: Optional[str] = Query(None, description="Filtra por area de investigacion"),
    session: Session = Depends(get_session),
):
    query = select(Advisor)

    if research_area:
        # ARRAY contains: busca el area exacta dentro del campo TEXT[]
        query = query.where(Advisor.research_areas.contains([research_area]))

    advisors = session.exec(query.offset(offset).limit(limit)).all()

    return [
        AdvisorListItem(
            id=a.id,
            full_name=a.full_name,
            research_areas=a.research_areas,
						advisor_dni=a.advisor_dni,
            thesis_count=a.thesis_count,
            external_publications_count=a.external_publications_count,
            orcid=a.orcid,
        )
        for a in advisors
    ]


@router.get("/{advisor_id}", response_model=AdvisorRead)
def get_advisor(advisor_id: str, session: Session = Depends(get_session)):
    advisor = session.get(Advisor, advisor_id)
    if not advisor:
        raise HTTPException(status_code=404, detail="Asesor no encontrado")

    return AdvisorRead(
        id=advisor.id,
        full_name=advisor.full_name,
        research_areas=advisor.research_areas,
        thesis_count=advisor.thesis_count,
        external_publications_count=advisor.external_publications_count,
        orcid=advisor.orcid,
        name_variants=advisor.name_variants,
        advisor_dni=advisor.advisor_dni,
    )
