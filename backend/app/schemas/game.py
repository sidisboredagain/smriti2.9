from typing import Any

from pydantic import BaseModel


class GameResponse(BaseModel):
    game_type: str
    memory_id: int | None = None
    question: str
    options: list[str]
    answer: str
    difficulty: str
    game_data: dict[str, Any] | None = None

class GameAnswer(BaseModel):
    answer: str

class GameForPlayer(BaseModel):
    game_id: int
    game_type: str
    memory_id: int | None = None
    question: str
    options: list[str]
    difficulty: str
    game_data: dict[str, Any] | None = None

class GameAnswerMetrics(BaseModel):
    """Optional progress signals reported by the richer game UIs."""
    mistakes: int | None = None
    time_seconds: float | None = None
    attempts: int | None = None

class GameAnswerRequest(BaseModel):
    game_id: int
    answer: str
    session_id: int | None = None
    metrics: GameAnswerMetrics | None = None