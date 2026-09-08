from datetime import datetime

from pydantic import BaseModel, ConfigDict


class MemoryCreate(BaseModel):
    patient_id: int
    title: str
    content: str
    category: str | None = None
    # Optional ordered sequence of familiar steps (e.g. for a wedding trip:
    # ["Invitation arrives", "Travel to Jaipur", "Wedding celebration"]).
    # Powers the Memory Sequence game without ever inventing events.
    sequence_steps: list[str] | None = None

class MemoryUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    category: str | None = None
    sequence_steps: list[str] | None = None


class MemoryResponse(BaseModel):
    id: int
    patient_id: int
    title: str
    content: str
    category: str | None = None
    sequence_steps: list[str] | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)