# Smriti AI

Smriti AI is a memory-care companion app for people living with dementia and the
caregivers supporting them. A caregiver builds up a library of a patient's real
memories — text, photos, voice recordings — and the app turns that into gentle,
personalized cognitive games, a calming "Comfort" screen for difficult moments,
and a guided conversation mode where the patient can talk about their own
memories out loud.

This is a hackathon-stage prototype, not a finished clinical product. It runs
today with a single hardcoded patient record and a single shared database —
see [`SECURITY.md`](./SECURITY.md) for an honest list of what that means and
what would need to change before it could hold real, multi-patient data.

## What's actually in here

Two front-ends, one backend:

- **Caregiver app** (`frontend/src`, default route `/`) — register/login, manage
  a patient's profile, add memories with photos and voice notes, and run or
  review therapy/game sessions.
- **Patient app** (`frontend/src/patient`, route `/patient/*`) — a simplified,
  large-button interface meant for the patient themselves. No login: it reuses
  the caregiver's session, since asking someone with dementia to remember a
  password isn't reasonable. It has a Home screen, a Memories screen, a Play
  screen (the cognitive games), a Comfort screen, a Remember screen (record a
  new memory by voice), and a Teach Me screen (talk about a memory with
  Smriti).
- **Backend** (`backend/app`) — FastAPI + SQLAlchemy, JWT-authenticated,
  serving both front-ends from one API.

### The games are rule-based, not AI

`backend/app/services/ai_game_generator.py` pulls simple facts out of a
memory's text (people, places, events, activities) using keyword and pattern
matching, then plugs them into question templates — multiple choice, true/
false, fill-in-the-blank, memory match, memory sequence, picture matching, an
attention/focus grid, and a few others. Despite the filename, none of this is
machine learning. It's deterministic and works entirely offline.

### Teach Me Mode is the one real AI feature

From the patient app, a patient can pick a memory and talk about it. Their
speech is transcribed, and their words — together with the memory's
caregiver-written title/description and the conversation so far — are sent to
**Google Gemini** (`gemini-flash-latest` by default, overridable via
`GEMINI_MODEL`) with strict instructions: ask exactly one short, warm question
per turn, never invent a person/place/event that isn't already known, never
quiz or correct the patient, and reply in the patient's own language. Ending
the conversation always works instantly (a fixed closing line, no API call),
even if Gemini is slow or briefly unreachable.

### Voice output

"Listen" buttons throughout the app use Google's free **gTTS** to read text
aloud, automatically detecting the actual script of the text (rather than
blindly trusting the patient's configured language) so English-authored
content is read in an English voice and Hindi/Bengali/Assamese content is
read in a matching one.

### Languages

The patient app and the caregiver's Therapy screen are fully translated into
English, Hindi, Bengali, and Assamese (`frontend/src/lib/i18n.js`). Free-text
content a caregiver typed (a memory's title/description) stays in whatever
language it was written in — there's no machine-translation engine in this
project, so that content can't be auto-translated, only the app's own UI and
generated text.

## Tech stack

- **Frontend:** React 19 + Vite, React Router, Tailwind CSS, lucide-react
  icons (no emoji anywhere in the UI, by design).
- **Backend:** FastAPI, SQLAlchemy, Alembic migrations, JWT auth
  (`python-jose`) with bcrypt password hashing (`passlib`).
- **Database:** SQLite for local development (`backend/smriti2_dev.db`),
  Postgres-ready via `DATABASE_URL`.
- **Speech-to-text:** Google's free Web Speech API via the `SpeechRecognition`
  package (not paid Google Cloud Speech-to-Text) — browser audio is converted
  from webm to WAV with FFmpeg first.
- **Text-to-speech:** gTTS (free, keyless).
- **Conversational AI:** Google Gemini via the official `google-genai`
  package, used only for Teach Me Mode.

## Project structure

```
backend/
  app/
    api/         # FastAPI routers (auth, patients, memories, games,
                 #   therapy_sessions, voice, tts, teach_me, reminders, ...)
    models/      # SQLAlchemy models
    schemas/     # Pydantic request/response schemas
    services/    # ai_game_generator.py, teach_me_service.py
    utils/       # security, uploads, role-based auth dependencies
  alembic/       # database migrations
  requirements.txt
frontend/
  src/
    pages/            # caregiver app screens (Login, Dashboard, MemoryVault, Therapy, ...)
    patient/           # the whole patient-facing app, under /patient
      pages/
      components/
      context/
    lib/               # i18n.js, gameWidgets.jsx, shared helpers
SECURITY.md            # honest security audit
IMPLEMENTATION_REPORT.md
backend/API.md         # endpoint reference
```

## Getting started

### Backend

```
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
```

Create `backend/.env` (see `backend/.env.example` for the shape) with at
least:

```
DATABASE_URL=sqlite:///./smriti2_dev.db
SECRET_KEY=some-long-random-string
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
GEMINI_API_KEY=your-gemini-key      # optional — only needed for Teach Me Mode
```

Get a free Gemini key at https://aistudio.google.com/apikey. Without it,
everything except Teach Me Mode still works fine.

Then run the API:

```
uvicorn app.main:app --reload
```

It comes up on `http://127.0.0.1:8000` — see `backend/API.md` for the full
endpoint list.

### Frontend

```
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` for the caregiver app, and
`http://localhost:5173/patient` for the patient app.

## Known limitations

Documented honestly, in full, in [`SECURITY.md`](./SECURITY.md) — the short
version: there's no per-caregiver data ownership yet (any logged-in caregiver
can see any patient's data), uploaded photos/recordings are served from a
public unauthenticated folder, there's no rate limiting, and `SECRET_KEY` has
a hardcoded fallback in `security.py`. None of these are fixed silently
without saying so — they're called out so they don't get forgotten before
this holds real patient data.
