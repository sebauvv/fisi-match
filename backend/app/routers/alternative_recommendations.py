"""Router de alternative recommendations: POST /students/{student_id}/alt_recommendations — invoca Lambda Phase 7."""

import json
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.database import get_session
from app.models.alignment import AlignmentReport
from app.services.aws import get_recommender_lambda_client
from app.services.auth import get_current_student_id
from app.config import get_settings

settings = get_settings()

router = APIRouter(prefix="/students", tags=["alternative_recommendations"])


@router.post("/{student_id}/alt_recommendations/{report_id}")
def get_alternative_recommendations(
    student_id: uuid.UUID,
    report_id: uuid.UUID,
    db: Session = Depends(get_session),
    current_id: str = Depends(get_current_student_id),
):
    """Obtiene recomendaciones alternativas basadas en un reporte de alineamiento específico."""
    if str(student_id) != current_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sin acceso al perfil de otro estudiante",
        )

    # 1. Obtiene el alignment_report específico
    statement = (
        select(AlignmentReport)
        .where(
            AlignmentReport.student_id == student_id,
            AlignmentReport.id == report_id
        )
    )
    report = db.exec(statement).first()

    if not report:
        raise HTTPException(
            status_code=404,
            detail="Alignment report not found."
        )

    # 2. Invoca al lambda de la fase 7
    lambda_client = get_recommender_lambda_client()
    payload = json.dumps({"alignment_report": report.report_json}, ensure_ascii=False)

    try:
        response = lambda_client.invoke(
            FunctionName=settings.recommender_lambda_function,
            InvocationType="RequestResponse",
            Payload=payload.encode("utf-8"),
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Error al invocar Lambda: {exc}")

    # 3. Procesa y retorna la respuesta
    raw_payload = response["Payload"].read().decode("utf-8")

    if response.get("FunctionError"):
        raise HTTPException(
            status_code=502,
            detail=f"Lambda retornó un error: {raw_payload}",
        )

    try:
        outer = json.loads(raw_payload)
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="Respuesta de Lambda no es JSON válido")

    if isinstance(outer, dict) and "body" in outer:
        body_content = outer["body"]
        if isinstance(body_content, str):
            try:
                return json.loads(body_content)
            except json.JSONDecodeError:
                raise HTTPException(status_code=502, detail="El body de la respuesta no es JSON válido")
        return body_content

    return outer
