import os
import re
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
    # gTTS (and the free Google Translate voice service it wraps) has no
    # Assamese voice at all -- "as" is not in gtts.lang.tts_langs(), so
    # requesting it used to fail this call with a 500 error every single
    # time, for every feature that speaks text aloud (Memories, Comfort,
    # Teach Me, therapy questions). Until a real Assamese voice is
    # available, this falls back to the Bengali voice as the closest
    # approximation (related script and phonology) so Assamese-language
    # patients get some spoken audio instead of none -- it will sound
    # like Bengali pronunciation, not authentic Assamese speech. If that
    # trade-off isn't the right one, the honest alternative is to not
    # offer a "Listen" button at all when a patient's language is
    # Assamese.
    "Assamese": "bn",
}

_DEVANAGARI_RE = re.compile(r"[\u0900-\u097F]")
_BENGALI_RE = re.compile(r"[\u0980-\u09FF]")
_LATIN_RE = re.compile(r"[A-Za-z]")


def _detect_spoken_language_code(text: str, requested_language: str) -> str:
    """
    Pick the gTTS voice that actually matches the text being read,
    instead of always trusting the patient's configured display
    language.

    This endpoint is used to read two very different kinds of text
    aloud: the app's own generated question/UI text, which is already
    written in the patient's chosen language, and a caregiver's own
    memory content, which is free text typed in whatever language the
    caregiver used (almost always English, regardless of the patient's
    configured language). gTTS does not translate -- it just applies a
    language's pronunciation rules to whatever characters it's given --
    so playing English words with a Hindi/Bengali voice (or vice versa)
    comes out mispronounced. Detecting the actual script of the text
    fixes that for both cases without needing any change on the
    frontend, which still just requests "the patient's language" as
    before.
    """
    devanagari_count = len(_DEVANAGARI_RE.findall(text))
    bengali_count = len(_BENGALI_RE.findall(text))
    latin_count = len(_LATIN_RE.findall(text))

    if devanagari_count and devanagari_count >= bengali_count and devanagari_count >= latin_count:
        return "hi"

    if bengali_count and bengali_count >= latin_count:
        # Bengali and Assamese share the same Unicode block, so script
        # alone can't tell them apart. Keep whichever of the two the
        # caller actually asked for -- both currently map to the same
        # "bn" gTTS voice anyway (see LANGUAGE_CODES above).
        return LANGUAGE_CODES.get(requested_language, "bn")

    if latin_count:
        return "en"

    # No strong signal either way (e.g. the text is just punctuation or
    # numbers) -- fall back to whatever voice was requested.
    return LANGUAGE_CODES.get(requested_language, "en")


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

        spoken_language_code = _detect_spoken_language_code(text, language)

        tts = gTTS(
            text=text,
            lang=spoken_language_code,
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