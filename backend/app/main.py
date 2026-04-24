"""
FISI Match API — entry point.

source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import auth, students, profile, advisors, theses, publications, stats, metadata

settings = get_settings()

app = FastAPI(
    title="FISI Match API",
    description="Sistema de recomendacion de asesores de tesis — UNMSM FISI",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(students.router)
app.include_router(profile.router)
app.include_router(advisors.router)
app.include_router(theses.router)
app.include_router(publications.router)
app.include_router(stats.router)
app.include_router(metadata.router)


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}
