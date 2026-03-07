import os
from fastapi import Header, HTTPException, status


def validate_internal_token(x_internal_token: str = Header(default="")) -> bool:
    required = os.getenv("INTERNAL_SERVICE_TOKEN", "").strip()
    if not required:
        # If token is not configured, allow local development.
        return True
    if x_internal_token != required:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid internal service token",
        )
    return True
