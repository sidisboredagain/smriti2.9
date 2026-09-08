from fastapi import Depends, HTTPException, status

from app.models.user import User
from app.utils.dependencies import get_current_user


def require_doctor(
    current_user: User = Depends(get_current_user),
):
    if current_user.role.lower() != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Doctor access required",
        )

    return current_user


def require_caregiver(
    current_user: User = Depends(get_current_user),
):
    if current_user.role.lower() != "caregiver":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Caregiver access required",
        )

    return current_user


def require_doctor_or_caregiver(
    current_user: User = Depends(get_current_user),
):
    if current_user.role.lower() not in [
        "doctor",
        "caregiver",
    ]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    return current_user