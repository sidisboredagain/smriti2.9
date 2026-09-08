from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func

from app.database.database import Base


class GeneratedGame(Base):
    __tablename__ = "generated_games"

    id = Column(Integer, primary_key=True, index=True)

    memory_id = Column(Integer, nullable=False, index=True)

    game_type = Column(String, nullable=False)

    question = Column(Text, nullable=False)

    options = Column(Text, nullable=False)

    answer = Column(String, nullable=False)

    difficulty = Column(String, nullable=False)

    language = Column(String, nullable=False, default="English")

    # Optional structured payload for richer game UIs (Memory Match cards,
    # Memory Sequence steps, Object/Visual Recall icon metadata, etc).
    # Stored as a JSON-encoded string so existing games are unaffected.
    game_data = Column(Text, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )