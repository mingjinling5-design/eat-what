from sqlmodel import SQLModel, Session, create_engine
from sqlalchemy import text

DATABASE_URL = "sqlite:///./eat_what.db"

engine = create_engine(
    DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False},
)


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)


def migrate_database():
    """
    兼容旧数据库。
    如果旧的 eathistory 表没有 user_id 字段，就自动加上。
    """
    with engine.connect() as conn:
        columns = conn.execute(text("PRAGMA table_info(eathistory)")).fetchall()
        column_names = {column[1] for column in columns}

        if "user_id" not in column_names:
            conn.execute(
                text("ALTER TABLE eathistory ADD COLUMN user_id INTEGER DEFAULT 0")
            )
            conn.commit()


def get_session():
    with Session(engine) as session:
        yield session