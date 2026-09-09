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

    # Optional link to a specific Memory row (memories.id) chosen by the
    # caregiver as this patient's comfort memory. When set, Comfort Mode
    # in the patient app can show that memory's real title, content,
    # photo, and recording instead of only the free-text comfort_memory
    # description above. Not declared as a SQL ForeignKey, matching how
    # Memory.patient_id already relates to this table -- relations here
    # are validated at the API layer rather than by a DB constraint.
    comfort_memory_id = Column(Integer, nullable=True)