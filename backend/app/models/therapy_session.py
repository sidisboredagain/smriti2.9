from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func

from app.database.database import Base


class TherapySession(Base):
    __tablename__ = "therapy_sessions"

    id = Column(Integer, primary_key=True, index=True)

    patient_id = Column(Integer, nullable=False, index=True)

    status = Column(
        String,
        nullable=False,
        default="active"
    )

    total_games = Column(
        Integer,
        nullable=False,
        default=0
    )

    completed_games = Column(
        Integer,
        nullable=False,
        default=0
    )

    started_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    completed_at = Column(
        DateTime(timezone=True),
        nullable=True
    )