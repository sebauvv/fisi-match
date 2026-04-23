"""Router de estudiantes: GET /students/{id}, PUT /students/{id}."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.database import get_session
from app.models.student import Student
from app.schemas.student import StudentRead, StudentUpdate
from app.services.auth import get_current_student_id

router = APIRouter(prefix="/students", tags=["students"])


@router.get("/{student_id}", response_model=StudentRead)
def get_student(
    student_id: uuid.UUID,
    session: Session = Depends(get_session),
    current_id: str = Depends(get_current_student_id),
):
    if str(student_id) != current_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sin acceso al perfil de otro estudiante",
        )

    student = session.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Estudiante no encontrado")

    return StudentRead.from_orm_student(student)


@router.put("/{student_id}", response_model=StudentRead)
def update_student(
    student_id: uuid.UUID,
    body: StudentUpdate,
    session: Session = Depends(get_session),
    current_id: str = Depends(get_current_student_id),
):
    """
    Actualiza los campos editables del perfil del estudiante.
    Solo el propio estudiante puede actualizar su perfil (JWT coincide con student_id).
    """
    if str(student_id) != current_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sin acceso al perfil de otro estudiante",
        )

    student = session.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Estudiante no encontrado")

    # Solo actualiza los campos enviados (partial update)
    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(student, field, value)

    session.add(student)
    session.commit()
    session.refresh(student)

    return StudentRead.from_orm_student(student)
