from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel


class AlignmentReportRead(BaseModel):
    id: UUID
    student_id: UUID
    thesis_idea: str
    alignment_level: str
    score_pct: int
    topic_requirements: Optional[str] = None
    student_profile_summary: Optional[str] = None
    justification: str
    student_strengths: Optional[str] = None
    skill_gaps: Optional[str] = None
    report_json: Any
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
