"""Shared authentication middleware for FastAPI routers."""

from fastapi import Request, HTTPException

from src.config import settings


def verify_internal_key(request: Request):
    """Verify the request comes from the Express backend."""
    auth = request.headers.get("x-internal-key", "")
    if settings.internal_api_key and auth != settings.internal_api_key:
        raise HTTPException(status_code=401, detail="Invalid internal key")
