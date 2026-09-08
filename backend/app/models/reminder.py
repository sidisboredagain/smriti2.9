from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from sqlalchemy.sql import func

from app.database.database import Base


class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True, index=True)

    patient_id = Column(
        Integer,
        nullable=False,
        index=True,
    )

    title = Column(
        String,
        nullable=False,
    )

    reminder_type = Column(
        String,
        nullable=False,
    )

    description = Column(
        Text,
        nullable=True,
    )

    scheduled_at = Column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )

    repeat = Column(
        String,
        nullable=False,
        default="once",
    )

    completed = Column(
        Boolean,
        nullable=False,
        default=False,
    )

    active = Column(
        Boolean,
        nullable=False,
        default=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    completed_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )