# Implementation Report — Smriti AI (smriti2.9)

This report covers the work done in this pass against the eight-item request: Memory Comfort improvements, photo upload review, a full security audit, honest documentation of the transcription and LLM providers, a new Attention Focus game, a new Teach Me conversational mode, and a look at the Record a Memory / FFmpeg situation. It follows the same rule the request itself set: nothing here is guessed or invented — every claim was checked against the actual code before being written down.

## 1. Features implemented

Memory Comfort now tracks consecutive wrong answers during a game session and offers Comfort Mode immediately after two in a row, in addition to the existing 15-second inactivity timeout, and now draws from a pool of the patient's own photographed/recorded memories instead of always showing the same single designated one. Photo upload for memories gained a preview-before-save step, a server-side size limit, and cleanup of replaced/deleted files. A new Attention Focus cognitive game (find every matching icon in a grid) was added end to end. A new Teach Me conversational mode was built, where the patient talks about one of their own memories and Smriti (via Google Gemini, grounded only in what the caregiver actually wrote about that memory) asks short, gentle follow-up questions. A security audit was carried out and written up honestly in `SECURITY.md`, with two real, low-risk issues fixed directly. The transcription and LLM providers this project actually uses are now documented accurately in that same file — including the fact that, until this pass, there was no LLM in this codebase at all.

## 2. Files and components changed

Backend: `app/services/ai_game_generator.py` (Attention Focus generation), `app/api/games.py` (Attention Focus answer-checking, supported-types list), `app/api/therapy_sessions.py` (Attention Focus added to the daily game plan), `app/api/memories.py` (photo size limit, old-file cleanup), `app/utils/uploads.py` (new `delete_upload()` helper), `app/services/teach_me_service.py` (new — Gemini wrapper), `app/schemas/teach_me.py` (new), `app/api/teach_me.py` (new), `app/main.py` (registers the Teach Me router), `requirements.txt` (added `google-genai`).

Frontend: `frontend/src/lib/gameWidgets.jsx` (new `AttentionFocusGame` component), `frontend/src/pages/Therapy.jsx` and `frontend/src/patient/pages/PatientPlay.jsx` (both wired up to render it), `frontend/src/pages/MemoryVault.jsx` (photo preview flow), `frontend/src/patient/context/PatientContext.jsx` (comfort-memory pool and picker), `frontend/src/patient/components/ComfortCard.jsx` (image/audio loading and error states), `frontend/src/patient/pages/PatientPlay.jsx` (consecutive-wrong-answer trigger), `frontend/src/patient/pages/PatientTeachMe.jsx` (new), `frontend/src/patient/PatientApp.jsx` and `frontend/src/patient/pages/PatientHome.jsx` (wire up the new Teach Me screen).

New file at the repo root: `SECURITY.md`.

## 3. Database changes

None. Every feature in this pass was built on the existing schema deliberately — Memory Comfort reuses memories that already have `image_url`/`audio_url`, Attention Focus stores its grid as a JSON payload in the existing `game_data`/`answer` fields the same way Memory Sequence already does, and Teach Me Mode is a stateless conversation (the frontend carries the transcript, nothing new is persisted). No Alembic migration was needed or created.

## 4. APIs added or modified

Added: `POST /teach-me/turn` (patient ID, memory ID, language, conversation history, and either the patient's latest transcribed line or a stop request; returns Smriti's next line and whether the conversation is over). Modified: `POST /games/generate/{memory_id}` and `POST /games/check-answer` now accept `attention_focus` as a game type; `POST /therapy-sessions/daily/{patient_id}` now returns six games per day instead of five (Attention Focus was added to the rotation); `POST /memories/{id}/photo` now enforces an 8&nbsp;MB size limit and cleans up the file it replaces; `DELETE /memories/{id}` now also removes that memory's photo/recording from disk.

## 5. Memory Comfort — exact behavior

Comfort Mode can trigger two ways during a Play session: the existing 15-second no-interaction timeout, or two wrong answers in a row (new). Either way, it picks a comfort item from a pool built from the patient's own memories — the caregiver's specifically designated comfort memory first, then any other memory that has a real photo or voice recording attached — and avoids repeating whichever item was shown last time, so triggering it twice in one session doesn't show the identical thing twice in a row unless that's genuinely the only option. The comfort card itself now shows a loading spinner while its photo loads and a gentle fallback message if the photo fails to load, instead of a broken image or silence. Nothing about it ever says "wrong" or shows a score — that was already true before this pass and was preserved throughout.

## 6. Photo upload — implementation

A caregiver selecting a photo in Memory Vault now sees a preview of that exact photo, with separate "Save photo" and "Cancel" buttons, before anything is uploaded — previously the file uploaded immediately on selection with no chance to back out. The upload itself still validates file extension server-side (JPG/PNG/WEBP/GIF) and now also rejects anything over 8&nbsp;MB, server-side, which was previously unbounded. Photos are already associated per-patient (via the memory they belong to) and already viewable in both Memory Vault and the patient app's Memories screen. Deleting a memory, or replacing its photo, now also deletes the corresponding file from `backend/uploads/` instead of leaving it there forever. One thing was deliberately **not** changed: uploaded files are still served from a public, unauthenticated static folder (unguessable UUID filenames, but no login check) — making that private would mean rewriting how every photo and recording is displayed across five-plus frontend files, which felt like more architectural change than this pass should make unasked; it's called out clearly in `SECURITY.md` instead.

## 7. Security measures currently in place

Passwords are hashed with bcrypt, never stored in plain text. Authentication is a JWT bearer token, not a cookie, so there's no CSRF exposure. Every route except one goes through role-based auth (`require_caregiver`/`require_doctor`/`require_doctor_or_caregiver`). All database access goes through the SQLAlchemy ORM with bound parameters — no raw SQL, so no realistic SQL-injection surface. The frontend is a React SPA with no `dangerouslySetInnerHTML` or `eval` anywhere, so it gets React's default output escaping. File uploads validate extension and (as of this pass) size, server-side. Secrets live in `backend/.env`, which is `.gitignore`d and confirmed never committed. Full detail is in `SECURITY.md`.

## 8. Security issues fixed in this pass

Two real, low-risk issues were fixed directly: photo uploads had no server-side size limit at all (now capped at 8&nbsp;MB), and replacing or deleting a memory's photo/recording left the old file on disk forever (now cleaned up via a new `delete_upload()` helper).

## 9. Remaining security limitations (documented, not fixed)

Four things are flagged honestly in `SECURITY.md` as real limitations that were **not** fixed in this pass, because each would require a broader change than "fix what's found without breaking anything": there is no per-caregiver ownership scoping at all, so any authenticated caregiver or doctor can read and modify any patient's data — the single most important thing to address before this holds real multi-patient data; uploaded files are served from a public static folder with no auth check; there is no rate limiting anywhere, including on login; and `SECRET_KEY` is a hardcoded fallback value in `security.py`, left untouched because an earlier session explicitly asked for that file to be left alone. A fifth, smaller issue was found and documented but not fixed: `POST /voice/transcribe` has no authentication check at all, unlike nearly every other route.

## 10. Transcription — exact provider and model

Google's free, keyless Web Speech API, called through the Python `SpeechRecognition` library's `recognizer.recognize_google(...)` — **not** paid Google Cloud Speech-to-Text, and no API key involved. Browser-recorded audio (webm) is converted to WAV with FFmpeg first, since the recognizer can't read webm directly; a bundled `imageio-ffmpeg` binary is used automatically if no system FFmpeg is installed. This was already true before this pass; it's now documented accurately in `SECURITY.md` and confirmed unchanged.

## 11. LLM — exact provider and model

Before this pass: **none**. Despite an unused `openai` package sitting in `requirements.txt`, no code anywhere in this project called any LLM — the game-generation engine (`ai_game_generator.py`) is a 100% rule-based regex/template system across all four languages, not AI in the generative sense. As of this pass: **Google Gemini**, specifically the `gemini-2.5-flash` model (configurable via a `GEMINI_MODEL` env var if that name is ever retired), called through the official `google-genai` Python package with a `GEMINI_API_KEY` you added to `backend/.env`. It's used only for Teach Me Mode's follow-up questions. If asked "what LLM does Smriti use?", the accurate answer is now: Google Gemini (`gemini-2.5-flash`), used specifically for the Teach Me feature — the older game-generation system is still rule-based, not LLM-driven, and that wasn't changed.

## 12. Attention Focus — implementation

A new cognitive game where the patient taps every grid cell showing a target icon among a couple of distractor icons. The backend (`generate_attention_focus_game` in `ai_game_generator.py`) builds a randomized grid sized by difficulty (easy/medium/hard), with instructions and the target's name translated into all four supported languages. Answers are checked with an order-independent set comparison against the correct cell IDs (`api/games.py`). It's now one of the six games in each patient's daily rotation (`api/therapy_sessions.py`) and renders identically in both the caregiver-facing Therapy screen and the patient app's Play screen via a shared `AttentionFocusGame` component, following the same icon-name-string convention (never emoji) already used elsewhere in this codebase.

## 13. Teach Me — implementation

From the patient app's new "Teach Me" home tile, the patient picks one of their existing memories, then talks about it out loud. Their speech goes through the same transcription pipeline as Record a Memory; the transcript, the memory's caregiver-written title and description, and the conversation so far are sent to Gemini with strict instructions: ask exactly one short, warm question per turn, never invent a person, place, or event that isn't already known, never quiz or correct the patient, and reply in the patient's own language. Smriti's reply is shown as text with a "Listen" button (matching how every other spoken line in this app already works) and the patient can keep talking or tap "I'm done for now" at any point, which ends the conversation with a fixed, instant closing line rather than another Gemini call — so stopping always works even if the API is briefly unreachable. A conversation also ends on its own after six exchanges as a gentle safety cap. **This feature will not work yet on your machine** until you run `pip install -r backend/requirements.txt` inside your backend's virtual environment (to install the new `google-genai` package) and restart the backend — see point 16.

## 14. Bugs fixed

Two real bugs, both described under points 6 and 8: the missing photo-size limit, and orphaned upload files never being cleaned up. Everything else in this pass was new functionality or documentation, not a bug fix — no other defects were found in the areas this pass touched.

## 15. Tests and build checks completed

Every backend Python file touched or added in this pass — and, as a final check, every `.py` file under `backend/app/` — was verified with `py_compile`, which confirms the code is syntactically valid Python (it does not run the server or exercise any logic). Every frontend file touched was checked for balanced parentheses/braces/brackets after every edit, which catches the most common way a manual JSX edit silently breaks a file. I do not have the ability to actually run this project's backend or frontend from where these changes were made — the shell I have access to can read and write files in your project folders but can't execute the Windows virtual environment's Python or start `npm run dev`, so no live request was ever made against these new endpoints, and no browser ever rendered the new screens. Please treat the manual-testing list below as required, not optional.

## 16. Remaining manual-testing items (please do these)

Run `pip install -r backend/requirements.txt` in your backend's virtual environment, then restart the backend, before testing anything below — Teach Me Mode will fail with a clear "package isn't installed" error until you do.

Then: start a therapy session and play through all six games, including a fresh Attention Focus round, on both the caregiver Therapy screen and the patient Play screen. Deliberately answer two questions wrong in a row and confirm Comfort Mode appears immediately (not just after 15 seconds), and that it doesn't show the exact same comfort item twice in a row if you trigger it more than once. Upload a photo in Memory Vault and confirm you now see a preview with Save/Cancel before it's actually saved, and try uploading something over 8&nbsp;MB to confirm it's rejected. Open the new "Teach Me" tile in the patient app, pick a memory, and have an actual voice conversation with Smriti — check that its questions stay grounded in what you actually wrote about that memory (it shouldn't invent people or events), that it works in a non-English language if you use one, and that "I'm done for now" ends things gracefully. Finally, read through `SECURITY.md` yourself, particularly the "no per-patient ownership scoping" limitation — it's the one item on that list worth taking seriously before this is used with anyone else's real data.
