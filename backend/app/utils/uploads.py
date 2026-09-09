import os
import uuid

# Files uploaded by caregivers/patients (memory photos, voice recordings)
# are stored on local disk under backend/uploads/<subfolder>/ and served
# back out via the static mount added in app/main.py. This keeps things
# simple for the hackathon prototype -- no object storage service needed
# -- while still giving every stored file a stable URL the frontend can
# use directly.

UPLOADS_ROOT = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "uploads",
)


def save_upload(file_bytes: bytes, subfolder: str, extension: str) -> str:
    """
    Writes file_bytes to backend/uploads/<subfolder>/<random-name><extension>
    and returns the public URL path (e.g. "/uploads/voice/<uuid>.webm") to
    store on the owning row.
    """

    target_dir = os.path.join(UPLOADS_ROOT, subfolder)
    os.makedirs(target_dir, exist_ok=True)

    safe_extension = extension if extension.startswith(".") else f".{extension}"
    filename = f"{uuid.uuid4().hex}{safe_extension}"

    with open(os.path.join(target_dir, filename), "wb") as destination:
        destination.write(file_bytes)

    return f"/uploads/{subfolder}/{filename}"
