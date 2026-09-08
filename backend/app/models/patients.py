from sqlalchemy import Column, Integer, String, Text

from app.database.database import Base


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    age = Column(Integer)
    language = Column(String)
    caregiver_name = Column(String)

    favorite_color = Column(String, nullable=True)
    favorite_animal = Column(String, nullable=True)
    favorite_activity = Column(String, nullable=True)
    favorite_food = Column(String, nullable=True)
    favorite_place = Column(String, nullable=True)
    comfort_memory = Column(Text, nullable=True)