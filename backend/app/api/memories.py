import os

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.memory import Memory
from app.models.user import User
from app.schemas.memory import MemoryCreate, MemoryUpdate, MemoryResponse
from app.services.memory_graph import build_patient_memory_graph
from app.utils.roles import require_doctor_or_caregiver
from app.utils.uploads import save_upload


router = APIRouter(
    prefix="/memories",
    tags=["Memories"]
)


ALLOWED_PHOTO_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}


@router.post("/", response_model=MemoryResponse)
def create_memory(
    memory: MemoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor_or_caregiver),
):
    new_memory = Memory(
        patient_id=memory.patient_id,
        title=memory.title,
        content=memory.content,
        category=memory.category
    )

    if memory.sequence_steps:
        new_memory.sequence_steps = memory.sequence_steps

    db.add(new_memory)
    db.commit()
    db.refresh(new_memory)

    return new_memory


@router.get("/", response_model=list[MemoryResponse])
def get_memories(
    patient_id: int,
    category: str | None = None,
    search: str | None = None,
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor_or_caregiver),
):
    query = db.query(Memory).filter(Memory.patient_id == patient_id)

    if category is not None:
        query = query.filter(Memory.category == category)

    if search is not None:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Memory.title.ilike(search_pattern))
            | (Memory.content.ilike(search_pattern))
        )

    return query.offset(skip).limit(limit).all()


@router.post("/{memory_id}/photo", response_model=MemoryResponse)
async def upload_memory_photo(
    memory_id: int,
    file: UploadFile = File(...),
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

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="Photo file is required."
        )

    extension = os.path.splitext(file.filename)[1].lower()

    if extension not in ALLOWED_PHOTO_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Unsupported photo format. Use JPG, PNG, WEBP, or GIF."
        )

    photo_bytes = await file.read()

    if not photo_bytes:
        raise HTTPException(
            status_code=400,
            detail="Uploaded photo file is empty."
        )

    memory.image_url = save_upload(
        photo_bytes,
        subfolder="memories",
        extension=extension,
    )

    db.commit()
    db.refresh(memory)

    return memory


@router.get("/graph/{patient_id}")
def get_memory_graph(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor_or_caregiver),
):
    memories = (
        db.query(Memory)
        .filter(Memory.patient_id == patient_id)
        .all()
    )

    memory_data = [
        {
            "id": memory.id,
            "title": memory.title,
            "content": memory.content,
            "category": memory.category,
        }
        for memory in memories
    ]

    return build_patient_memory_graph(memory_data)


@router.get("/{memory_id}", response_model=MemoryResponse)
def get_memory(
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

    return memory


@router.put("/{memory_id}", response_model=MemoryResponse)
def update_memory(
    memory_id: int,
    memory_update: MemoryUpdate,
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

    if memory_update.title is not None:
        memory.title = memory_update.title

    if memory_update.content is not None:
        memory.content = memory_update.content

    if memory_update.category is not None:
        memory.category = memory_update.category

    if memory_update.sequence_steps is not None:
        memory.sequence_steps = memory_update.sequence_steps

    db.commit()
    db.refresh(memory)

    return memory


@router.delete("/{memory_id}")
def delete_memory(
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

    db.delete(memory)
    db.commit()

    return {
        "message": "Memory deleted successfully"
    }