from app.schemas.student import (
    LoginRequest,
    TokenResponse,
    StudentUpdate,
    StudentRead,
    CreditsSummaryRead,
)
from app.schemas.advisor import AdvisorListItem, AdvisorRead
from app.schemas.thesis import ThesisListItem, ThesisRead
from app.schemas.publication import PublicationRead

__all__ = [
    "LoginRequest",
    "TokenResponse",
    "StudentUpdate",
    "StudentRead",
    "CreditsSummaryRead",
    "AdvisorListItem",
    "AdvisorRead",
    "ThesisListItem",
    "ThesisRead",
    "PublicationRead",
]
