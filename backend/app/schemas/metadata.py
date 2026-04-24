from pydantic import BaseModel

class ResearchAreaRead(BaseModel):
    id: int
    name: str
    advisor_count: int

class ThesisSubjectRead(BaseModel):
    id: int
    name: str
    thesis_count: int

class PublicationTypeRead(BaseModel):
    code: str
    label_es: str
    pub_count: int
