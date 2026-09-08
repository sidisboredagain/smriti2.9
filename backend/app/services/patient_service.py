from sqlalchemy.orm import Session
from app.models.patients import Patient
from app.schemas.patient import PatientCreate


def create_patient(db: Session, patient: PatientCreate):
    new_patient = Patient(
        full_name=patient.full_name,
        age=patient.age,
        language=patient.language,
        caregiver_name=patient.caregiver_name,
    )

    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)

    return new_patient


def get_all_patients(db: Session):
    return db.query(Patient).all()


def get_patient(db: Session, patient_id: int):
    return db.query(Patient).filter(Patient.id == patient_id).first()


def delete_patient(db: Session, patient_id: int):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()

    if patient:
        db.delete(patient)
        db.commit()

    return patient