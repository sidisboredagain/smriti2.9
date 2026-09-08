from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.game_attempt import GameAttempt
from app.models.memory import Memory
from app.models.patients import Patient
from app.models.therapy_session import TherapySession
from app.models.user import User
from app.utils.roles import require_caregiver

router = APIRouter(
    prefix="/caregiver",
    tags=["Caregiver"],
)


@router.get("/dashboard/{patient_id}")
def get_caregiver_dashboard(
    patient_id: int,
    current_user: User = Depends(require_caregiver),
    db: Session = Depends(get_db),
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

    attempts = (
        db.query(GameAttempt)
        .join(
            Memory,
            GameAttempt.memory_id == Memory.id,
        )
        .filter(
            Memory.patient_id == patient_id
        )
        .all()
    )

    sessions = (
        db.query(TherapySession)
        .filter(
            TherapySession.patient_id == patient_id
        )
        .order_by(
            TherapySession.started_at.desc()
        )
        .all()
    )

    total_attempts = len(attempts)

    correct_attempts = sum(
        1
        for attempt in attempts
        if attempt.correct
    )

    total_score = sum(
        attempt.score
        for attempt in attempts
    )

    accuracy = (
        (correct_attempts / total_attempts) * 100
        if total_attempts > 0
        else 0
    )

    total_games_completed = sum(
        session.completed_games
        for session in sessions
    )

    latest_session = sessions[0] if sessions else None

    recent_activity = (
        db.query(GameAttempt)
        .join(
            Memory,
            GameAttempt.memory_id == Memory.id,
        )
        .filter(
            Memory.patient_id == patient_id
        )
        .order_by(
            GameAttempt.created_at.desc()
        )
        .limit(10)
        .all()
    )

    return {
        "patient": {
            "id": patient.id,
            "full_name": patient.full_name,
            "age": patient.age,
            "language": patient.language,
            "caregiver_name": patient.caregiver_name,
        },
        "overall_progress": {
            "total_attempts": total_attempts,
            "correct_attempts": correct_attempts,
            "total_score": total_score,
            "accuracy_percent": round(accuracy, 2),
            "total_games_completed": total_games_completed,
        },
        "latest_session": {
            "session_id": latest_session.id,
            "status": latest_session.status,
            "total_games": latest_session.total_games,
            "completed_games": latest_session.completed_games,
            "progress_percent": round(
                (
                    latest_session.completed_games
                    / latest_session.total_games
                ) * 100,
                2,
            ) if latest_session and latest_session.total_games > 0 else 0,
            "started_at": latest_session.started_at,
            "completed_at": latest_session.completed_at,
        } if latest_session else None,
        "recent_activity": [
            {
                "attempt_id": attempt.id,
                "memory_id": attempt.memory_id,
                "game_type": attempt.game_type,
                "difficulty": attempt.difficulty,
                "correct": attempt.correct,
                "score": attempt.score,
                "created_at": attempt.created_at,
            }
            for attempt in recent_activity
        ],
    }