"""Router de asesores: GET /advisors, GET /advisors/{id}."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, func

from app.database import get_session
from app.models.advisor import Advisor
from app.schemas.advisor import AdvisorListItem, AdvisorRead, AdvisorListPaginated

router = APIRouter(prefix="/advisors", tags=["advisors"])


@router.get("", response_model=AdvisorListPaginated)
def list_advisors(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    research_area: Optional[str] = Query(None, description="Filtra por area de investigacion (exacta si es vieja, parcial si es search_area)"),
    search_name: Optional[str] = Query(None, description="Busca parcialmente por nombre"),
    search_area: Optional[str] = Query(None, description="Busca parcialmente por area combinada"),
    has_orcid: Optional[bool] = Query(None, description="Filtra por existencia de ORCID"),
    session: Session = Depends(get_session),
):
    query = select(Advisor)

    if research_area:
        query = query.where(Advisor.research_areas.contains([research_area]))

    if search_area:
        # Se requiere buscar áreas similares dentro del array, o exactas
        # sqlmodel para postgresql array puede tener limitaciones en ilike, usamos contains u overlaps
        # temporalmente lo forzamos a contains exacto del término (o puedes armar custom sql)
        query = query.where(Advisor.research_areas.contains([search_area]))

    if search_name:
        query = query.where(Advisor.full_name.ilike(f"%{search_name}%"))

    if has_orcid is not None:
        if has_orcid:
            query = query.where(Advisor.orcid != None)
        else:
            query = query.where(Advisor.orcid == None)

    # count total items
    count_query = select(func.count()).select_from(query.subquery())
    total = session.exec(count_query).one()

    advisors = session.exec(query.offset(offset).limit(limit)).all()

    items = [
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

    return AdvisorListPaginated(
        items=items,
        total=total,
        limit=limit,
        offset=offset
    )


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
