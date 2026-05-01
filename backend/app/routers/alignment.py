"""Router de alignment: POST /students/{student_id}/alignment — invoca Lambda Phase 6."""

import json
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.database import get_session
from app.models.student import Student
from app.models.alignment import AlignmentReport
from app.schemas.alignment import AlignmentReportRead
from app.services.aws import get_alignment_lambda_client
from app.services.auth import get_current_student_id
from app.config import get_settings

settings = get_settings()

router = APIRouter(prefix="/students", tags=["alignment"])


@router.post("/{student_id}/alignment", response_model=AlignmentReportRead)
def generate_alignment_report(
    student_id: uuid.UUID,
    db: Session = Depends(get_session),
    current_id: str = Depends(get_current_student_id),
):
    """Invoca el Lambda de Alignment Evaluator y guarda el reporte."""
    if str(student_id) != current_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sin acceso al perfil de otro estudiante",
        )

    student = db.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")

    if not student.thesis_idea or not student.thesis_idea.strip():
        raise HTTPException(status_code=400, detail="El estudiante no tiene una idea de tesis registrada")

    # Preparamos el payload
    payload = {
        "student_data": {
            "periodos_academicos": student.periodos_academicos,
            "cv_text": student.cv_text,
            "thesis_idea": student.thesis_idea
        }
    }
    
    lambda_client = get_alignment_lambda_client()

    try:
        response = lambda_client.invoke(
            FunctionName=settings.alignment_lambda_function,
            InvocationType="RequestResponse",
            Payload=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Error al invocar Lambda: {exc}")

    # Leemos la respuesta
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

    # Extraemos el body (el Lambda retorna statusCode y body)
    if isinstance(outer, dict) and "body" in outer:
        body_content = outer["body"]
        if isinstance(body_content, str):
            try:
                report_data = json.loads(body_content)
            except json.JSONDecodeError:
                raise HTTPException(status_code=502, detail="El body de la respuesta no es JSON válido")
        else:
            report_data = body_content
    else:
        report_data = outer

    if "error" in report_data:
        raise HTTPException(status_code=400, detail=report_data["error"])

    # Aplanar arrays para texto
    def flatten_to_text(field_data):
        if not field_data:
            return None
        if isinstance(field_data, list):
            return "\n".join(f"- {item}" for item in field_data)
        return str(field_data)

    # Crear registro en la BD
    alignment_report = AlignmentReport(
        student_id=student.id,
        thesis_idea=student.thesis_idea,
        alignment_level=report_data.get("alignment_level", "Media"),
        score_pct=report_data.get("score_pct", 0),
        topic_requirements=flatten_to_text(report_data.get("topic_requirements")),
        student_profile_summary=flatten_to_text(report_data.get("student_profile_summary")),
        justification=flatten_to_text(report_data.get("justification")) or "Sin justificación",
        student_strengths=flatten_to_text(report_data.get("student_strengths")),
        skill_gaps=flatten_to_text(report_data.get("skill_gaps")),
        report_json=report_data,
    )

    db.add(alignment_report)
    db.commit()
    db.refresh(alignment_report)

    return alignment_report
