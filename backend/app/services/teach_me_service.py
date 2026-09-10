import os
import time

from dotenv import load_dotenv

# database.py already calls this at import time, but this module can in
# principle be imported on its own (e.g. from a test), so it's repeated
# here too -- python-dotenv's load_dotenv() is a cheap no-op on a second
# call and never overwrites variables that are already set.
load_dotenv()

# Overridable via backend/.env in case this alias's behavior ever changes.
# Gemini model names get retired on their own schedule (this project has
# already hit that once, with "gemini-2.5-flash" returning a 404 telling
# callers to move to a newer model) -- "gemini-flash-latest" is Google's
# own alias that always points at their current default Flash model, so
# this stops going stale on its own. Google gives two weeks' notice by
# email before swapping what "latest" points to, so this is not a
# guarantee this will never need to change again, just that it won't
# break as often as pinning one exact snapshot name would.
_GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-flash-latest")

_client = None
_client_error = None


class TeachMeUnavailableError(Exception):
    """Raised whenever Teach Me Mode cannot get a reply from Gemini right
    now -- a missing API key, the package not being installed, or a
    network/API failure. The message is written to be shown to a
    caregiver directly (it never leaks a stack trace or the key itself)."""


def _get_client():
    global _client, _client_error

    if _client is not None:
        return _client

    if _client_error is not None:
        # Don't keep retrying a client that's already known to be broken
        # (e.g. no key configured) on every single request.
        raise _client_error

    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        _client_error = TeachMeUnavailableError(
            "Teach Me Mode needs a GEMINI_API_KEY in backend/.env. Get a "
            "free key at https://aistudio.google.com/apikey and add it "
            "there, then restart the backend."
        )
        raise _client_error

    try:
        from google import genai
    except ImportError as error:
        _client_error = TeachMeUnavailableError(
            "The google-genai package isn't installed yet. Run "
            "`pip install -r requirements.txt` inside the backend's "
            "virtual environment, then restart the server."
        )
        raise _client_error from error

    try:
        _client = genai.Client(api_key=api_key)
    except Exception as error:
        _client_error = TeachMeUnavailableError(
            f"Could not start the Gemini client: {error}"
        )
        raise _client_error from error

    return _client


# Every rule here exists to satisfy an explicit requirement for Teach Me
# Mode: ground answers only in what's actually known, never quiz or
# correct the patient, ask one gentle thing at a time, and reply in the
# patient's own language.
_SYSTEM_INSTRUCTIONS = """You are Smriti, a warm, patient companion for someone living with dementia. \
Right now they are telling you about a memory of theirs called "{memory_title}". Here is everything you \
are allowed to know about this memory, provided by their caregiver: "{memory_context}"

Rules you must always follow, without exception:
1. Ask about exactly ONE thing per reply, as a single short, warm, plain-language sentence (under 20 \
words), written in {language}.
2. Never invent people, places, dates, feelings, or events that are not already in the memory description \
above or in what {patient_name} has told you earlier in this conversation. If a detail isn't known, ask \
about it gently instead of assuming or stating it as fact.
3. Never test, quiz, or correct {patient_name}, and never imply an answer is wrong or that they should \
remember something. Questions like "do you remember what happened next?" are not allowed -- instead invite \
them to share more in their own words, e.g. "What else do you remember about that day?"
4. Keep a warm, unhurried, non-judgmental tone throughout, like a beloved younger relative listening closely.
5. Reply with ONLY the single sentence you would say out loud next. No labels, no quotation marks, no notes \
to yourself, nothing in a language other than {language}.
"""


def generate_teach_me_reply(
    *,
    patient_name: str | None,
    memory_title: str | None,
    memory_content: str | None,
    history: list[dict],
    patient_message: str | None,
    language: str,
) -> str:
    """
    Returns Smriti's next single, gentle line of conversation, grounded
    only in the given memory's caregiver-provided description and
    whatever has actually been said so far in `history` / `patient_message`.
    Raises TeachMeUnavailableError if Gemini can't be reached.
    """

    client = _get_client()

    display_name = patient_name or "the patient"

    system_instructions = _SYSTEM_INSTRUCTIONS.format(
        memory_title=memory_title or "this memory",
        memory_context=(
            memory_content
            or "(no extra detail was provided -- warmly ask the patient to describe it themselves)"
        ),
        language=language or "English",
        patient_name=display_name,
    )

    conversation_lines = []

    for turn in history:
        speaker = "You (Smriti)" if turn.get("role") == "smriti" else display_name
        text = str(turn.get("text", "")).strip()

        if text:
            conversation_lines.append(f"{speaker}: {text}")

    if patient_message:
        conversation_lines.append(f"{display_name}: {patient_message.strip()}")

    conversation_text = (
        "\n".join(conversation_lines)
        if conversation_lines
        else "(This is the very first turn -- warmly invite them to start telling you about this memory.)"
    )

    prompt = (
        f"{system_instructions}\n\nConversation so far:\n{conversation_text}"
        "\n\nYour next single gentle reply:"
    )

    # Google's free tier for Gemini is shared across everyone using it,
    # so it occasionally answers a perfectly normal request with a
    # transient "model is overloaded, try again" error that has nothing
    # to do with this app or this request. A single short, silent retry
    # smooths over that common case so the patient/caregiver doesn't have
    # to notice the error and manually retry themselves -- if the second
    # attempt also fails, something more persistent is wrong and that's
    # surfaced as before.
    last_error = None

    for attempt in range(2):
        try:
            response = client.models.generate_content(
                model=_GEMINI_MODEL,
                contents=prompt,
            )
            last_error = None
            break
        except Exception as error:
            last_error = error

            if attempt == 0:
                time.sleep(1.5)

    if last_error is not None:
        raise TeachMeUnavailableError(
            f"Teach Me Mode couldn't reach Gemini right now ({last_error}). "
            "Please try again in a moment."
        ) from last_error

    text = (getattr(response, "text", None) or "").strip()

    if not text:
        raise TeachMeUnavailableError(
            "Gemini didn't return a reply that time. Please try again."
        )

    return text


# Fixed per-language closings, deliberately NOT routed through Gemini --
# stopping the conversation must work instantly, even if the API key is
# missing, the network is down, or Gemini is slow to respond right then.
_CLOSING_LINES = {
    "English": "Thank you for sharing that with me. That was lovely to hear.",
    "Hindi": "यह मेरे साथ साझा करने के लिए धन्यवाद। यह सुनकर बहुत अच्छा लगा।",
    "Bengali": "এটি আমার সাথে ভাগ করে নেওয়ার জন্য ধন্যবাদ। এটি শুনে ভালো লাগল।",
    "Assamese": "মোর সংগে এইটো ভাগ-বতৰা কৰাৰ বাবে ধন্যবাদ। শুনি ভাল লাগিল।",
}


def generate_teach_me_closing(*, language: str | None) -> str:
    return _CLOSING_LINES.get(language or "English", _CLOSING_LINES["English"])
