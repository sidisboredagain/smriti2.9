from pydantic import BaseModel, Field


class TeachMeTurn(BaseModel):
    role: str  # "smriti" or "patient"
    text: str


class TeachMeTurnRequest(BaseModel):
    patient_id: int
    memory_id: int
    language: str = "English"
    history: list[TeachMeTurn] = Field(default_factory=list)
    # What the patient just said, transcribed from their voice. None on
    # the very first turn, when Smriti opens the conversation.
    patient_message: str | None = None
    # Set when the patient (or the frontend's turn cap) wants to end the
    # conversation. When true, a fixed closing line is returned instead
    # of calling Gemini, so "stop" always works instantly.
    stop_requested: bool = False


class TeachMeTurnResponse(BaseModel):
    message: str
    done: bool
