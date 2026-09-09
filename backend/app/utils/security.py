from datetime import datetime, timedelta, timezone

from jose import jwt
from passlib.context import CryptContext

SECRET_KEY = "your-secret-key-change-this"
ALGORITHM = "HS256"

# The patient-facing app expects a caregiver to sign in on a shared tablet
# once and leave it running for the rest of the day (a patient with
# dementia should never be asked to log in). A short-lived token would
# silently break every request once it expired mid-session, so this stays
# generous rather than the usual tight web-session default.
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str,
) -> bool:
    return pwd_context.verify(
        plain_password,
        hashed_password,
    )


def create_access_token(data: dict) -> str:
    to_encode = data.copy()

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    to_encode.update({"exp": expire})

    return jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )