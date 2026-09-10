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


def delete_upload(stored_url: str | None) -> None:
    """
    Removes a previously saved upload from disk given the public URL path
    that save_upload() returned (e.g. "/uploads/memories/<uuid>.jpg").

    Used when a photo/recording is replaced or its owning row is deleted,
    so old files don't pile up forever in backend/uploads/. Best-effort:
    a missing file, an unexpected path shape, or any other error here is
    swallowed rather than raised, since a stale file left on disk is a
    minor cleanup issue -- never a reason to fail the caller's request.
    """

    if not stored_url or not stored_url.startswith("/uploads/"):
        return

    relative_path = stored_url[len("/uploads/"):]
    full_path = os.path.normpath(os.path.join(UPLOADS_ROOT, relative_path))

    # Guard against a stored value that (however it got there) escapes the
    # uploads directory via ".." segments -- never delete outside it.
    if os.path.commonpath([full_path, UPLOADS_ROOT]) != UPLOADS_ROOT:
        return

    try:
        os.remove(full_path)
    except OSError:
        pass
