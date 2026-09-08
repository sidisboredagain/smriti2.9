from sqlalchemy.orm import Session

from app.models.game_attempt import GameAttempt
from app.models.memory import Memory


def get_recommended_difficulty(
    patient_id: int,
    db: Session
) -> str:
    """
    Recommend difficulty based on the patient's recent performance.

    Rules:
    - No attempts -> easy
    - Accuracy below 30% -> comfort (gentle, no-pressure mode)
    - Accuracy 30% to below 50% -> easy
    - Accuracy 50% to below 80% -> medium
    - Accuracy 80% or higher -> hard
    """

    attempts = (
        db.query(GameAttempt)
        .join(
            Memory,
            GameAttempt.memory_id == Memory.id
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

    if not attempts:
        return "easy"

    correct_attempts = sum(
        1
        for attempt in attempts
        if attempt.correct
    )

    accuracy = (
        correct_attempts / len(attempts)
    ) * 100

    if accuracy < 30:
        return "comfort"

    if accuracy < 50:
        return "easy"

    if accuracy < 80:
        return "medium"

    return "hard"