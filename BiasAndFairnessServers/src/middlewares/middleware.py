from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
import base64
import json

class TenantMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        """
        Resolve tenant for the incoming request.
        Priority:
          1) Authorization: Bearer <JWT> with payload.tenantId
          2) x-tenant-id header (backwards-compat / CLI)
        """
        tenant_id = None

        # 1) Try Authorization JWT (no signature verification; middleware context only)
        auth = request.headers.get("authorization") or request.headers.get("Authorization")
        if auth and auth.lower().startswith("bearer "):
            token = auth.split(" ", 1)[1].strip()
            parts = token.split(".")
            if len(parts) == 3:
                payload_b64 = parts[1]
                # Fix base64url padding
                padding = "=" * (-len(payload_b64) % 4)
                try:
                    payload_json = base64.urlsafe_b64decode(payload_b64 + padding).decode("utf-8")
                    payload = json.loads(payload_json)
                    # Common keys used across the app
                    tenant_id = (
                        payload.get("tenantId")
                        or payload.get("tenant_id")
                        or payload.get("tenant")
                    )
                except Exception:
                    # Ignore parse errors; fall back to header
                    pass

        # 2) Fallback to x-tenant-id header if present
        if not tenant_id:
            tenant_id = request.headers.get("x-tenant-id")

        if not tenant_id:
            raise HTTPException(status_code=400, detail="Missing tenant id.")

        # Stash for routers/controllers
        request.state.tenant = str(tenant_id)

        # Continue processing the request
        return await call_next(request)
