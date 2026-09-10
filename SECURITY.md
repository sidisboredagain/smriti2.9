# Security Overview — Smriti AI

This document is an honest account of the security posture of this codebase as it
exists today: what is implemented, what was fixed during this review, and what
remains a known limitation. It was written by inspecting the actual code, not
from assumptions about what a typical app "should" have — nothing here is
invented or guessed. If a claim below stops being true after a future change,
please update this file alongside that change.

**Context:** this is a hackathon-stage prototype with a single hardcoded patient
record (`PATIENT_ID = 1` in the frontend) and a single shared local SQLite/Postgres
database. Some of the limitations below are acceptable for that stage and are
flagged here so they are not forgotten if the project moves toward real patient
data or multiple caregiving organizations.

## Authentication

- Users (caregivers/doctors) register and log in via `POST /auth/register` and
  `POST /auth/login` (`backend/app/api/auth.py`). Passwords are hashed with
  **bcrypt** via `passlib` (`backend/app/utils/security.py`) — plaintext
  passwords are never stored.
- Login returns a **JWT bearer token** (`python-jose`, HS256) that the frontend
  stores in `localStorage` and sends as `Authorization: Bearer <token>` on every
  request. There is no cookie-based session, so there is no CSRF exposure (see
  CSRF section below).
- Failed logins return a single generic `"Invalid email or password"` message
  regardless of whether the email or the password was wrong — this is correct
  practice, since it doesn't let an attacker enumerate which emails are
  registered.
- Access tokens are long-lived (24 hours, `ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24`
  in `security.py`). This is a deliberate, documented tradeoff for a shared
  tablet the caregiver logs into once and leaves running for the patient's
  session — but it does mean a stolen token stays valid for a full day. There is
  no refresh-token or logout/revocation mechanism; the only way to invalidate a
  token today is to change `SECRET_KEY` (which invalidates every token at once).
- The patient-facing app (`frontend/src/patient/*`) reuses the same caregiver
  login/token — patients themselves never authenticate, by design (a person with
  dementia should not be asked to remember a password).

## Authorization / access control

- Every protected route requires a valid bearer token (`get_current_user` in
  `backend/app/utils/dependencies.py`), and most routes additionally require a
  specific role via `require_caregiver` / `require_doctor` /
  `require_doctor_or_caregiver` (`backend/app/utils/roles.py`).
- **Known limitation, not fixed in this pass:** authorization is role-only. There
  is no concept of a caregiver being scoped to "their" patients — the `User` and
  `Patient` models have no relationship between them at all. In practice this
  means **any authenticated caregiver or doctor account can read and modify any
  patient's records**, including memories, photos, and therapy history, not only
  the ones they created. For a single-patient hackathon demo this has no visible
  effect, but it is the single most important thing to fix before this app is
  used with real, multi-patient data. Fixing it properly means adding a
  patient-ownership relationship and backfilling every existing route (`memories`,
  `patients`, `therapy_sessions`, `games`, `voice`, `reminders`, `caregiver`,
  `adaptive`) to filter by it — a real schema and API change, which is why it
  was documented here rather than attempted as a quick patch in this pass (the
  instruction for this review was to avoid risky architectural changes).

## Database access

- All queries go through the SQLAlchemy ORM with parameter binding
  (`db.query(Model).filter(...)`); there is no raw/string-interpolated SQL
  anywhere in the backend, so classic SQL injection is not a realistic risk here.
- The database connection string lives in `backend/.env` (`DATABASE_URL`), loaded
  via `python-dotenv`, and is never hardcoded or logged.

## Secrets and environment configuration

- `backend/.env` holds `DATABASE_URL`, `SECRET_KEY`, `ALGORITHM`,
  `ACCESS_TOKEN_EXPIRE_MINUTES`, and now also `GEMINI_API_KEY`. `.env` is listed
  in `backend/.gitignore` and confirmed **not** tracked by git — it has never
  been committed.
- **Known limitation, left as-is intentionally:** `backend/app/utils/security.py`
  has a hardcoded fallback `SECRET_KEY = "your-secret-key-change-this"` used to
  sign every JWT. This was flagged in an earlier review and the decision at the
  time was to leave it unchanged, so it was not modified again in this pass.
  Anyone with read access to this repository's source knows the exact signing
  key used unless the deployment overrides it — which today it does not, since
  `security.py` never reads `SECRET_KEY` from the environment at all. If this
  is ever deployed somewhere reachable by untrusted users, this key should be
  moved to `backend/.env` and generated randomly per deployment; flagging that
  here is the extent of what this review does about it, per the standing
  decision to leave the file alone.
- The vestigial `OPENAI_API_KEY` slot in `.env.example` has never been used by
  any code path (see "AI providers" below) and can be removed or left blank
  with no effect.
- The new `GEMINI_API_KEY` is read server-side only (see "AI providers") and is
  never sent to the frontend or included in any API response.

## Input validation

- Request bodies are validated by Pydantic schemas (`backend/app/schemas/*`) —
  malformed JSON or wrong types are rejected by FastAPI before a route body ever
  runs.
- File uploads (photos, voice recordings) validate file extension against an
  allowlist server-side (not just by trusting the browser's `accept=` attribute).
  As of this review, photo uploads (`POST /memories/{id}/photo`) also enforce a
  server-side **8 MB size limit** — previously there was no size limit at all,
  which meant a caregiver's browser could send an arbitrarily large file straight
  to disk. Voice recording uploads should be given the same treatment if this
  project grows past the hackathon stage (not changed in this pass, to keep the
  change surface small).

## File upload storage

- Uploaded photos and voice recordings are written to `backend/uploads/<subfolder>/`
  under a randomly generated UUID filename (`app/utils/uploads.py`) — the
  original filename from the browser is never used to name the stored file,
  which avoids path-traversal and filename-collision issues.
- `backend/uploads/` is excluded from git via `.gitignore` and confirmed not
  tracked.
- As of this review, replacing a memory's photo or deleting a memory now also
  deletes the corresponding file(s) from disk (`delete_upload()` in
  `uploads.py`) — previously, changing or removing a photo left the old file on
  disk forever, which was a storage leak rather than a data-exposure issue but
  is fixed now regardless.
- **Known limitation, not changed in this pass:** uploaded files are served back
  out via a fully public static file mount (`app.mount("/uploads", ...)` in
  `main.py`) with **no authentication check** — anyone who knows or guesses a
  file's URL can view it, whether or not they're logged in. Filenames are random
  UUIDs, so this isn't a directory-listing or guessable-path problem, but it is
  not truly private storage: a leaked or logged URL would expose that photo or
  recording to anyone. Making this properly private would mean serving uploads
  through an authenticated FastAPI route instead of a static mount, and changing
  every `<img>`/`<audio>` tag across the frontend (`MemoryVault.jsx`,
  `PatientProfile.jsx`, `Therapy.jsx`, `ComfortCard.jsx`, `PatientPlay.jsx`,
  `Dashboard.jsx`) to fetch with an auth header instead of using a plain `src=`
  URL — a broad frontend change, which is why it wasn't done in this pass.

## SQL injection / XSS / CSRF

- **SQL injection:** not a realistic risk — see "Database access" above.
- **XSS:** the frontend is a React SPA; there is no `dangerouslySetInnerHTML` or
  `eval()` anywhere in `frontend/src`, so user-entered text (memory titles,
  content, etc.) is rendered through React's default escaping rather than raw
  HTML injection.
- **CSRF:** not applicable in the traditional sense — authentication is a bearer
  token sent explicitly in an `Authorization` header, not an automatically-sent
  cookie, so there is no session for a third-party site to ride on.

## Authentication gap found during this review

- `POST /voice/transcribe` (`backend/app/api/voice.py`) has no `Depends(get_current_user)` /
  role check at all -- unlike almost every other route in this backend, it can be called by
  anyone who can reach the server, logged in or not. It doesn't touch the database or return
  patient data, so the impact today is limited to relaying arbitrary audio to Google's free
  speech-recognition endpoint on the caller's behalf (a minor quota/abuse concern, not a data
  exposure one). `POST /voice/transcribe-and-save/{patient_id}` and every other route are
  correctly protected. Not changed in this pass -- the Teach Me feature added in this review
  calls this same endpoint from the patient app, and gating it would need checking that the
  patient app's existing "Record a Memory" flow (which already calls this endpoint) still works
  correctly with auth required, which is more verification than this pass covered. Worth an
  explicit look before this goes anywhere more exposed than a local demo.

## Rate limiting

- **None exists anywhere in the backend** — `/auth/login`, `/auth/register`, and
  every other route can be called as fast as the network allows. This means the
  login endpoint has no brute-force protection. This was not added in this pass
  (introducing a rate-limiting dependency and deciding on limits per route is a
  behavior change beyond the scope of "fix real issues found without risky
  changes"), but it is worth prioritizing before any public-facing deployment.

## Sensitive data exposure / error messages

- Error responses (`HTTPException(detail=...)`) return short, generic messages
  ("Invalid email or password", "Memory not found", etc.) rather than raw
  exception text, stack traces, or database error strings — FastAPI's default
  behavior for unhandled exceptions in debug-off mode also avoids leaking stack
  traces to the client.
- The one `print()` statement in the backend (`therapy_sessions.py`, when game
  generation fails for a memory) logs only a memory ID and error type/message —
  no patient names, content, or credentials.

## CORS

- CORS is configured as `allow_origins=["*"]` with `allow_credentials=False`
  (`main.py`). This is intentionally wide open, and is safe specifically
  *because* credentials are disabled and auth is a Bearer token, not a cookie —
  a malicious site can't ride on a logged-in session it doesn't have the token
  for. This should be narrowed to the actual frontend origin(s) before a
  production deployment, but is not an active vulnerability today given the
  auth model.

## Production / deployment configuration

- There is no HTTPS enforcement, no production `Settings`/environment split
  (dev vs. prod config), and no deployment manifest in this repo — this is
  expected for a project that has been run locally throughout development.
  Before any real deployment: put this behind HTTPS, narrow CORS as above,
  generate a real `SECRET_KEY`, and add rate limiting to the auth routes.

## AI providers — documented honestly, not guessed

- **Transcription** (turning a patient's recorded voice into text): uses
  Google's **free, keyless Web Speech API** via the `SpeechRecognition` Python
  package's `recognizer.recognize_google(...)` call
  (`backend/app/api/voice.py`). This is **not** paid Google Cloud Speech-to-Text
  — it's the free public endpoint the `SpeechRecognition` library wraps, and it
  requires no API key. Audio recorded in the browser (webm) is converted to a
  WAV file with FFmpeg before being handed to `SpeechRecognition` (a real,
  necessary step — the recognizer needs an uncompressed audio format); a
  bundled static FFmpeg binary via `imageio-ffmpeg` is used as a fallback when
  no system `ffmpeg` is installed, so the app still works without asking every
  machine to install FFmpeg separately.
- **LLM:** as of the start of this review, **there was no LLM integration
  anywhere in this codebase**, despite an unused `openai` package in
  `requirements.txt` and an empty `OPENAI_API_KEY` slot in `.env.example`. The
  game-generation engine (`ai_game_generator.py`, despite its name) and
  `memory_dna.py` are both 100% rule-based: regex/keyword fact extraction over
  per-language template dictionaries (English/Hindi/Bengali/Assamese) — no
  network call, no model, no "AI" in the generative sense. If asked "what LLM
  does Smriti use?" before this review, the honest answer was **none — the
  game engine is a template system, not an LLM.**
  Google **Gemini** (free tier, via a `GEMINI_API_KEY` read server-side only)
  is being wired up as part of this review specifically to power the new
  "Teach Me" conversational mode, since that feature genuinely needs a real
  language model and there was no existing one to reuse. The key is never
  exposed to the frontend. Note for the record: Google's free tier may use
  submitted prompts/outputs to improve their products — worth knowing given
  patient speech transcripts are patient-adjacent data, even though no
  real patient names or identifying medical information are expected to flow
  through it in this app's current use.

## Summary of changes made during this security review

1. Added a server-side 8 MB size limit to photo uploads (`api/memories.py`) —
   previously unbounded.
2. Added `delete_upload()` (`utils/uploads.py`) so replacing or deleting a
   memory's photo/recording also removes the old file from disk, instead of
   leaving orphaned files in `backend/uploads/` forever.
3. Wrote this document, including a newly found authentication gap on
   `POST /voice/transcribe` (see above) that wasn't fixed in this pass.
4. Added Teach Me Mode's Gemini integration (`services/teach_me_service.py`,
   `api/teach_me.py`) behind the same `require_doctor_or_caregiver` auth
   already used everywhere else, with the `GEMINI_API_KEY` read server-side
   only and never returned to the frontend.

No other backend security behavior was changed — several real limitations
are called out above and left in place because fixing them properly requires
a broader architectural change than this pass was scoped for (per-patient
authorization scoping, private file serving, rate limiting, the unauthenticated
transcription route, and the hardcoded `SECRET_KEY`, the last of which was
previously and deliberately left as-is on request).
