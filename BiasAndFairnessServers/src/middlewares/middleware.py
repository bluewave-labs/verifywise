from fastapi import FastAPI, Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware

class TenantMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        tenant_id = request.headers.get("x-tenant-id")
        if not tenant_id:
            raise HTTPException(status_code=400, detail="Missing tenant id.")

        # Continue processing the request
        return await call_next(request)
