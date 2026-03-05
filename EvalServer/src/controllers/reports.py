"""
Controller for report generation endpoints.
"""

from typing import Any, Dict, List
from fastapi import HTTPException
from fastapi.responses import Response
from database.db import get_db
from crud import reports as crud
from utils.report_generator import generate_pdf_report, generate_csv_report


async def generate_report_controller(
    body: Dict[str, Any],
    tenant: str,
) -> Response:
    """Generate a PDF or CSV evaluation report."""

    experiment_ids: List[str] = body.get("experimentIds", [])
    if not experiment_ids:
        raise HTTPException(status_code=400, detail="No experiment IDs provided")

    project_id: str = body.get("projectId", "")
    report_format: str = body.get("format", "pdf").lower()
    config: Dict[str, Any] = body

    try:
        async with get_db() as db:
            project = None
            if project_id:
                project = await crud.get_project_info(db, tenant, project_id)

            project_name = (project or {}).get("name", "Unknown Project")
            org_name = body.get("orgName", "")

            experiments = await crud.get_experiments_for_report(
                db, tenant, experiment_ids
            )

            if not experiments:
                raise HTTPException(
                    status_code=404,
                    detail="No experiments found for the given IDs",
                )

            if report_format == "csv":
                csv_content = generate_csv_report(experiments, project_name)
                return Response(
                    content=csv_content,
                    media_type="text/csv",
                    headers={
                        "Content-Disposition": f'attachment; filename="{project_name}_eval_report.csv"',
                    },
                )

            pdf_bytes = generate_pdf_report(config, experiments, project_name, org_name)
            return Response(
                content=pdf_bytes,
                media_type="application/pdf",
                headers={
                    "Content-Disposition": f'inline; filename="{project_name}_eval_report.pdf"',
                },
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate report: {str(e)}",
        )
