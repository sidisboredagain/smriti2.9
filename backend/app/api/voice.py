import os
import shutil
import subprocess
import tempfile

import speech_recognition as sr
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.memory import Memory
from app.models.patients import Patient
from app.models.user import User
from app.schemas.memory import MemoryResponse
from app.utils.roles import require_doctor_or_caregiver

router = APIRouter(
    prefix="/voice",
    tags=["Voice"]
)


LANGUAGE_CODES = {
    "English": "en-IN",
    "Hindi": "hi-IN",
    "Bengali": "bn-IN",
    "Assamese": "as-IN",
}


def get_ffmpeg_path() -> str | None:
    """
    Find FFmpeg from PATH.
    """

    return shutil.which("ffmpeg")


def transcribe_audio_file(
    audio_bytes: bytes,
    extension: str,
    language: str
) -> str:
    if not audio_bytes:
        raise HTTPException(
            status_code=400,
            detail="Uploaded audio file is empty."
        )

    if language not in LANGUAGE_CODES:
        raise HTTPException(
            status_code=400,
            detail=(
                "Unsupported language. Use English, Hindi, "
                "Bengali, or Assamese."
            )
        )

    ffmpeg_path = get_ffmpeg_path()

    if ffmpeg_path is None:
        raise HTTPException(
            status_code=500,
            detail=(
                "FFmpeg was not found on the system PATH. "
                "Please install FFmpeg and add it to PATH."
            )
        )

    input_path = None
    wav_path = None

    try:
        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=extension
        ) as input_file:
            input_file.write(audio_bytes)
            input_path = input_file.name

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=".wav"
        ) as output_file:
            wav_path = output_file.name

        conversion = subprocess.run(
            [
                ffmpeg_path,
                "-y",
                "-i",
                input_path,
                "-ac",
                "1",
                "-ar",
                "16000",
                "-c:a",
                "pcm_s16le",
                wav_path,
            ],
            capture_output=True,
            text=True,
            check=False,
        )

        if conversion.returncode != 0:
            error_message = conversion.stderr.strip()

            raise HTTPException(
                status_code=400,
                detail=(
                    "Audio conversion failed."
                    + (
                        f" FFmpeg: {error_message[-1000:]}"
                        if error_message
                        else ""
                    )
                )
            )

        recognizer = sr.Recognizer()

        with sr.AudioFile(wav_path) as source:
            recorded_audio = recognizer.record(source)

        return recognizer.recognize_google(
            recorded_audio,
            language=LANGUAGE_CODES[language]
        )

    except sr.UnknownValueError:
        raise HTTPException(
            status_code=400,
            detail="Could not understand the audio."
        )

    except sr.RequestError:
        raise HTTPException(
            status_code=503,
            detail="Speech recognition service is unavailable."
        )

    finally:
        if input_path and os.path.exists(input_path):
            try:
                os.remove(input_path)
            except PermissionError:
                pass

        if wav_path and os.path.exists(wav_path):
            try:
                os.remove(wav_path)
            except PermissionError:
                pass


@router.post("/transcribe")
async def transcribe_voice(
    file: UploadFile = File(...),
    language: str = "English"
):
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="Audio file is required."
        )

    extension = os.path.splitext(file.filename)[1].lower()

    if extension not in {".m4a", ".wav", ".mp3", ".webm", ".ogg"}:
        raise HTTPException(
            status_code=400,
            detail=(
                "Unsupported audio format. Use M4A, WAV, MP3, "
                "WEBM, or OGG."
            )
        )

    audio_bytes = await file.read()

    text = transcribe_audio_file(
        audio_bytes=audio_bytes,
        extension=extension,
        language=language
    )

    return {
        "success": True,
        "language": language,
        "text": text
    }


@router.post(
    "/transcribe-and-save/{patient_id}",
    response_model=MemoryResponse
)
async def transcribe_and_save_memory(
    patient_id: int,
    file: UploadFile = File(...),
    language: str = "English",
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
            detail="Patient not found"
        )

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="Audio file is required."
        )

    extension = os.path.splitext(file.filename)[1].lower()

    if extension not in {".m4a", ".wav", ".mp3", ".webm", ".ogg"}:
        raise HTTPException(
            status_code=400,
            detail=(
                "Unsupported audio format. Use M4A, WAV, MP3, "
                "WEBM, or OGG."
            )
        )

    if language not in LANGUAGE_CODES:
        raise HTTPException(
            status_code=400,
            detail=(
                "Unsupported language. Use English, Hindi, "
                "Bengali, or Assamese."
            )
        )

    audio_bytes = await file.read()

    text = transcribe_audio_file(
        audio_bytes=audio_bytes,
        extension=extension,
        language=language
    )

    new_memory = Memory(
        patient_id=patient_id,
        title="Voice Memory",
        content=text,
        category="voice"
    )

    db.add(new_memory)
    db.commit()
    db.refresh(new_memory)

    return new_memory