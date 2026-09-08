from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.reminder import Reminder
from app.models.patients import Patient
from app.models.user import User
from app.utils.roles import require_doctor_or_caregiver


router = APIRouter(
    prefix="/reminders",
    tags=["Reminders"],
)


class ReminderCreate(BaseModel):
    patient_id: int
    title: str
    reminder_type: str
    description: str | None = None
    scheduled_at: datetime
    repeat: str = "once"


class ReminderUpdate(BaseModel):
    title: str | None = None
    reminder_type: str | None = None
    description: str | None = None
    scheduled_at: datetime | None = None
    repeat: str | None = None
    active: bool | None = None


@router.post("/")
def create_reminder(
    request: ReminderCreate,
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
            detail="Patient not found",
        )

    allowed_types = {
        "medicine",
        "hydration",
        "activity",
        "appointment",
    }

    if request.reminder_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid reminder type. Use medicine, hydration, "
                "activity, or appointment."
            ),
        )

    allowed_repeats = {
        "once",
        "daily",
        "weekly",
    }

    if request.repeat not in allowed_repeats:
        raise HTTPException(
            status_code=400,
            detail="Invalid repeat value. Use once, daily, or weekly.",
        )

    reminder = Reminder(
        patient_id=request.patient_id,
        title=request.title.strip(),
        reminder_type=request.reminder_type,
        description=request.description,
        scheduled_at=request.scheduled_at,
        repeat=request.repeat,
        completed=False,
        active=True,
    )

    db.add(reminder)
    db.commit()
    db.refresh(reminder)

    return reminder


@router.get("/patient/{patient_id}")
def get_patient_reminders(
    patient_id: int,
    include_completed: bool = True,
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
            detail="Patient not found",
        )

    query = (
        db.query(Reminder)
        .filter(
            Reminder.patient_id == patient_id,
            Reminder.active == True,
        )
    )

    if not include_completed:
        query = query.filter(
            Reminder.completed == False
        )

    reminders = (
        query
        .order_by(Reminder.scheduled_at.asc())
        .all()
    )

    return reminders


@router.get("/{reminder_id}")
def get_reminder(
    reminder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor_or_caregiver),
):
    reminder = (
        db.query(Reminder)
        .filter(Reminder.id == reminder_id)
        .first()
    )

    if reminder is None:
        raise HTTPException(
            status_code=404,
            detail="Reminder not found",
        )

    return reminder


@router.patch("/{reminder_id}")
def update_reminder(
    reminder_id: int,
    request: ReminderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor_or_caregiver),
):
    reminder = (
        db.query(Reminder)
        .filter(Reminder.id == reminder_id)
        .first()
    )

    if reminder is None:
        raise HTTPException(
            status_code=404,
            detail="Reminder not found",
        )

    allowed_types = {
        "medicine",
        "hydration",
        "activity",
        "appointment",
    }

    allowed_repeats = {
        "once",
        "daily",
        "weekly",
    }

    if (
        request.reminder_type is not None
        and request.reminder_type not in allowed_types
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid reminder type. Use medicine, hydration, "
                "activity, or appointment."
            ),
        )

    if (
        request.repeat is not None
        and request.repeat not in allowed_repeats
    ):
        raise HTTPException(
            status_code=400,
            detail="Invalid repeat value. Use once, daily, or weekly.",
        )

    if request.title is not None:
        reminder.title = request.title.strip()

    if request.reminder_type is not None:
        reminder.reminder_type = request.reminder_type

    if request.description is not None:
        reminder.description = request.description

    if request.scheduled_at is not None:
        reminder.scheduled_at = request.scheduled_at

    if request.repeat is not None:
        reminder.repeat = request.repeat

    if request.active is not None:
        reminder.active = request.active

    db.commit()
    db.refresh(reminder)

    return reminder


@router.post("/{reminder_id}/complete")
def complete_reminder(
    reminder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor_or_caregiver),
):
    reminder = (
        db.query(Reminder)
        .filter(Reminder.id == reminder_id)
        .first()
    )

    if reminder is None:
        raise HTTPException(
            status_code=404,
            detail="Reminder not found",
        )

    reminder.completed = True
    reminder.completed_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(reminder)

    return {
        "reminder_id": reminder.id,
        "completed": reminder.completed,
        "completed_at": reminder.completed_at,
    }


@router.post("/{reminder_id}/reopen")
def reopen_reminder(
    reminder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor_or_caregiver),
):
    reminder = (
        db.query(Reminder)
        .filter(Reminder.id == reminder_id)
        .first()
    )

    if reminder is None:
        raise HTTPException(
            status_code=404,
            detail="Reminder not found",
        )

    reminder.completed = False
    reminder.completed_at = None

    db.commit()
    db.refresh(reminder)

    return {
        "reminder_id": reminder.id,
        "completed": reminder.completed,
    }


@router.delete("/{reminder_id}")
def deactivate_reminder(
    reminder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor_or_caregiver),
):
    reminder = (
        db.query(Reminder)
        .filter(Reminder.id == reminder_id)
        .first()
    )

    if reminder is None:
        raise HTTPException(
            status_code=404,
            detail="Reminder not found",
        )

    reminder.active = False

    db.commit()

    return {
        "message": "Reminder deactivated",
        "reminder_id": reminder.id,
    }