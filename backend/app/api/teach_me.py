from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.memory import Memory
from app.models.patients import Patient
from app.models.user import User
from app.schemas.teach_me import TeachMeTurnRequest, TeachMeTurnResponse
from app.services.teach_me_service import (
    TeachMeUnavailableError,
    generate_teach_me_closing,
    generate_teach_me_reply,
)
from app.utils.roles import require_doctor_or_caregiver

router = APIRouter(
    prefix="/teach-me",
    tags=["Teach Me"],
)


# A gentle cap so a conversation doesn't run forever even if nobody taps
# "I'm done" -- the frontend also always shows that button regardless.
MAX_TEACH_ME_TURNS = 6


@router.post("/turn", response_model=TeachMeTurnResponse)
def teach_me_turn(
    request: TeachMeTurnRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor_or_caregiver),
):
    patient = (
        db.query(Patient)
        .filter(Patient.id == request.patient_id)
        .first()
    )

    if patient is None:
        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )

    memory = (
        db.query(Memory)
        .filter(
            Memory.id == request.memory_id,
            Memory.patient_id == request.patient_id,
        )
        .first()
    )

    if memory is None:
        raise HTTPException(
            status_code=404,
            detail="Memory not found for this patient"
        )

    reached_turn_cap = len(request.history) >= MAX_TEACH_ME_TURNS * 2

    if request.stop_requested or reached_turn_cap:
        closing = generate_teach_me_closing(language=request.language)

        return TeachMeTurnResponse(message=closing, done=True)

    try:
        message = generate_teach_me_reply(
            patient_name=patient.full_name,
            memory_title=memory.title,
            memory_content=memory.content,
            history=[turn.model_dump() for turn in request.history],
            patient_message=request.patient_message,
            language=request.language,
        )
    except TeachMeUnavailableError as error:
        raise HTTPException(
            status_code=503,
            detail=str(error)
        )

    return TeachMeTurnResponse(message=message, done=False)
