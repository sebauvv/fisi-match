"""Router de autenticacion: POST /login."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.database import get_session
from app.models.student import Student
from app.schemas.student import LoginRequest, TokenResponse
from app.services.auth import create_access_token, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, session: Session = Depends(get_session)):
    student = session.exec(
        select(Student).where(Student.email == body.email)
    ).first()

    if not student or not verify_password(body.password, student.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
        )

    token = create_access_token(str(student.id))

    return TokenResponse(
        access_token=token,
        student_id=str(student.id),
        email=student.email,
        nombres_apellidos=student.nombres_apellidos,
    )
