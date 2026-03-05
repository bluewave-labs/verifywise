"""API routes for evaluation report generation."""

from fastapi import APIRouter, Request
from controllers import reports as controller

router = APIRouter(prefix="/deepeval", tags=["Reports"])


@router.post("/reports/generate")
async def generate_report(request: Request):
    """Generate a PDF or CSV evaluation report."""
    body = await request.json()
    return await controller.generate_report_controller(
        body=body,
        tenant=request.headers["x-tenant-id"],
    )
