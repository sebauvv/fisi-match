from typing import Generator

from sqlmodel import Session, create_engine

from app.config import get_settings

settings = get_settings()

DATABASE_URL = (
    f"postgresql+psycopg2://{settings.db_user}:{settings.db_password}"
    f"@{settings.db_host}:{settings.db_port}/{settings.db_name}"
)

engine = create_engine(DATABASE_URL, echo=False)


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
