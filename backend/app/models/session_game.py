from sqlalchemy import Column, Integer, Boolean, DateTime
from sqlalchemy.sql import func

from app.database.database import Base


class SessionGame(Base):
    __tablename__ = "session_games"

    id = Column(Integer, primary_key=True, index=True)

    session_id = Column(
        Integer,
        nullable=False,
        index=True
    )

    game_id = Column(
        Integer,
        nullable=False,
        index=True
    )

    completed = Column(
        Boolean,
        nullable=False,
        default=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )