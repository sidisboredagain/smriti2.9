from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.patients import Patient
from app.models.user import User
from app.services.adaptive_difficulty import get_recommended_difficulty
from app.utils.roles import require_doctor_or_caregiver


router = APIRouter(
    prefix="/adaptive",
    tags=["Adaptive Difficulty"]
)


@router.get("/difficulty/{patient_id}")
def get_adaptive_difficulty(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor_or_caregiver),
):
    patient = (
        db.query(Patient)
        .filter(Patient.id == patient_id)
        .first()
    )

    if patient is None:
        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )

    difficulty = get_recommended_difficulty(
        patient_id=patient_id,
        db=db
    )

    return {
        "patient_id": patient_id,
        "recommended_difficulty": difficulty
    }