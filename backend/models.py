from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class EatHistory(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    user_id: int = Field(default=0, index=True)

    dish: str
    mode: str
    reason: str
    score: Optional[int] = None
    feedback: str = "[]"

    created_at: datetime = Field(default_factory=datetime.now)


class UserAccount(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    username: str = Field(index=True)
    password_hash: str
    salt: str

    created_at: datetime = Field(default_factory=datetime.now)