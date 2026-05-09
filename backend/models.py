from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class EatHistory(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    dish: str
    mode: str
    reason: str
    score: Optional[int] = None

    feedback: str = "[]"

    created_at: datetime = Field(default_factory=datetime.now)