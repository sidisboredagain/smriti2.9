import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database.database import engine
from app.database.base import Base

# Import all models so SQLAlchemy registers them
from app.models.memory import Memory
from app.models.patients import Patient
from app.models.generated_game import GeneratedGame
from app.models.game_attempt import GameAttempt
from app.models.user import User
from app.models.therapy_session import TherapySession
from app.models.session_game import SessionGame
from app.models.reminder import Reminder

# Import routers
from app.api.memories import router as memories_router
from app.api.games import router as games_router
from app.api.patients import router as patient_router
from app.api.auth import router as auth_router
from app.api.therapy_sessions import router as therapy_sessions_router
from app.api.voice import router as voice_router
from app.api.tts import router as tts_router
from app.api.memory_dna import router as memory_dna_router
from app.api.caregiver import router as caregiver_router
from app.api.adaptive import router as adaptive_router
from app.api.reminders import router as reminders_router


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Smriti AI Backend",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    # Note: allow_credentials must stay False here -- browsers reject the
    # combination of a wildcard origin with credentials enabled, which
    # silently breaks every cross-origin request (e.g. the frontend on
    # localhost:5173 calling the backend on 127.0.0.1:8000). This app
    # authenticates via a Bearer token in the Authorization header, not
    # cookies, so credentials mode was never actually needed.
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Serves the memory photos and voice recordings saved by
# app/utils/uploads.py (e.g. GET /uploads/memories/<uuid>.jpg).
UPLOADS_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "uploads"
)
os.makedirs(UPLOADS_DIR, exist_ok=True)

app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")


app.include_router(memories_router)
app.include_router(games_router)
app.include_router(patient_router)
app.include_router(auth_router)
app.include_router(therapy_sessions_router)
app.include_router(voice_router)
app.include_router(tts_router)
app.include_router(memory_dna_router)
app.include_router(caregiver_router)
app.include_router(adaptive_router)
app.include_router(reminders_router)


@app.get("/")
def root():
    return {
        "message": "Welcome to Smriti AI Backend 🚀"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }