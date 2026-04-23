from app.models.student import Student
from app.models.advisor import Advisor, ResearchArea
from app.models.thesis import Thesis
from app.models.publication import ExternalPublication, PublicationType

__all__ = [
    "Student",
    "Advisor",
    "ResearchArea",
    "Thesis",
    "ExternalPublication",
    "PublicationType",
]
