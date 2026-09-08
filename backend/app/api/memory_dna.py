from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.memory import Memory
from app.models.user import User
from app.services.memory_dna import build_memory_dna
from app.utils.roles import require_doctor_or_caregiver


router = APIRouter(
    prefix="/memory-dna",
    tags=["Memory DNA"]
)


@router.get("/{memory_id}")
def get_memory_dna(
    memory_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor_or_caregiver),
):
    memory = (
        db.query(Memory)
        .filter(Memory.id == memory_id)
        .first()
    )

    if memory is None:
        raise HTTPException(
            status_code=404,
            detail="Memory not found"
        )

    memory_data = {
        "id": memory.id,
        "title": memory.title,
        "content": memory.content,
    }

    return build_memory_dna(memory_data)