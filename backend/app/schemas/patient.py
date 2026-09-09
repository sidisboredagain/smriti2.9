from typing import Optional

from pydantic import BaseModel


class PatientCreate(BaseModel):
    full_name: str
    age: int
    language: str
    caregiver_name: str

    favorite_color: Optional[str] = None
    favorite_animal: Optional[str] = None
    favorite_activity: Optional[str] = None
    favorite_food: Optional[str] = None
    favorite_place: Optional[str] = None
    comfort_memory: Optional[str] = None
    comfort_memory_id: Optional[int] = None


class PatientUpdate(BaseModel):
    full_name: Optional[str] = None
    age: Optional[int] = None
    language: Optional[str] = None
    caregiver_name: Optional[str] = None

    favorite_color: Optional[str] = None
    favorite_animal: Optional[str] = None
    favorite_activity: Optional[str] = None
    favorite_food: Optional[str] = None
    favorite_place: Optional[str] = None
    comfort_memory: Optional[str] = None
    comfort_memory_id: Optional[int] = None


class PatientResponse(BaseModel):
    id: int
    full_name: str
    age: int
    language: str
    caregiver_name: str

    favorite_color: Optional[str] = None
    favorite_animal: Optional[str] = None
    favorite_activity: Optional[str] = None
    favorite_food: Optional[str] = None
    favorite_place: Optional[str] = None
    comfort_memory: Optional[str] = None
    comfort_memory_id: Optional[int] = None

    class Config:
        from_attributes = True