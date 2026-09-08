import os
import tempfile

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from gtts import gTTS


router = APIRouter(
    prefix="/tts",
    tags=["Text to Speech"]
)


LANGUAGE_CODES = {
    "English": "en",
    "Hindi": "hi",
    "Bengali": "bn",
    "Assamese": "as",
}


@router.get("/speak")
def text_to_speech(
    text: str,
    language: str = "English"
):
    if language not in LANGUAGE_CODES:
        raise HTTPException(
            status_code=400,
            detail=(
                "Unsupported language. Use English, Hindi, "
                "Bengali, or Assamese."
            )
        )

    if not text.strip():
        raise HTTPException(
            status_code=400,
            detail="Text cannot be empty."
        )

    audio_path = None

    try:
        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=".mp3"
        ) as audio_file:
            audio_path = audio_file.name

        tts = gTTS(
            text=text,
            lang=LANGUAGE_CODES[language],
            slow=False
        )

        tts.save(audio_path)

        return FileResponse(
            audio_path,
            media_type="audio/mpeg",
            filename="smriti-therapy.mp3"
        )

    except Exception as error:
        if audio_path and os.path.exists(audio_path):
            try:
                os.remove(audio_path)
            except PermissionError:
                pass

        raise HTTPException(
            status_code=500,
            detail=f"Text-to-speech failed: {str(error)}"
        )