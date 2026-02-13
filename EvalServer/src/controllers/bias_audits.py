"""
Bias Audits Controller

Handles bias audit creation, background task execution,
status polling, and result retrieval.
"""

import json
import traceback
from datetime import datetime
from typing import Dict, Any, Optional
from fastapi import HTTPException, BackgroundTasks, UploadFile
from fastapi.responses import JSONResponse

from database.db import get_db
from crud.bias_audits import (
    create_bias_audit,
    get_bias_audit,
    update_bias_audit_status,
    list_bias_audits,
    delete_bias_audit,
    create_bias_audit_result_rows,
    get_bias_audit_result_rows,
)

import sys
from pathlib import Path

# Add engines to path
engines_path = str(Path(__file__).parent.parent / "engines")
if engines_path not in sys.path:
    sys.path.insert(0, engines_path)


async def list_presets_controller() -> JSONResponse:
    """List all available bias audit presets (summaries only)."""
    from presets.bias_audits.loader import list_presets
    summaries = list_presets()
    return JSONResponse(status_code=200, content={"presets": summaries})


async def get_preset_controller(preset_id: str) -> JSONResponse:
    """Get full details of a single preset."""
    from presets.bias_audits.loader import get_preset
    preset = get_preset(preset_id)
    if not preset:
        raise HTTPException(status_code=404, detail=f"Preset '{preset_id}' not found")
    return JSONResponse(status_code=200, content={"preset": preset})


async def create_bias_audit_controller(
    background_tasks: BackgroundTasks,
    dataset: UploadFile,
    config_json: str,
    tenant: str,
    user_id: Optional[str] = None,
    org_id: Optional[str] = None,
) -> JSONResponse:
    """
    Create and execute a bias audit.

    1. Parse config, load preset, merge overrides
    2. Save audit record with status=pending
    3. Launch background task
    4. Return 202 with audit ID
    """
    try:
        config_data = json.loads(config_json)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=400, detail=f"Invalid config JSON: {e}")

    preset_id = config_data.get("presetId", "custom")
    from presets.bias_audits.loader import get_preset
    preset = get_preset(preset_id)
    preset_name = preset["name"] if preset else config_data.get("presetName", "Custom")
    mode = preset["mode"] if preset else config_data.get("mode", "quantitative_audit")

    # Generate audit ID
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    audit_id = f"bias_audit_{tenant}_{timestamp}"

    # Read CSV bytes
    csv_bytes = await dataset.read()
    if not csv_bytes:
        raise HTTPException(status_code=400, detail="Empty dataset file")

    # Resolve org_id
    effective_org_id = org_id or config_data.get("orgId", "")
    if not effective_org_id:
        raise HTTPException(status_code=400, detail="org_id is required")

    # Save to DB
    try:
        async with get_db() as db:
            created = await create_bias_audit(
                tenant=tenant,
                db=db,
                audit_id=audit_id,
                org_id=effective_org_id,
                project_id=config_data.get("projectId"),
                preset_id=preset_id,
                preset_name=preset_name,
                mode=mode,
                config=config_data,
                created_by=user_id,
            )
            await db.commit()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create audit: {e}")

    # Launch background task
    background_tasks.add_task(
        run_bias_audit_task,
        audit_id=audit_id,
        csv_bytes=csv_bytes,
        config_data=config_data,
        preset=preset,
        tenant=tenant,
    )

    return JSONResponse(
        status_code=202,
        content={
            "auditId": audit_id,
            "status": "pending",
            "message": "Bias audit started",
        },
    )


async def run_bias_audit_task(
    audit_id: str,
    csv_bytes: bytes,
    config_data: Dict[str, Any],
    preset: Optional[Dict[str, Any]],
    tenant: str,
) -> None:
    """Background task: parse CSV, run computation, store results."""
    try:
        # Update status to running
        async with get_db() as db:
            await update_bias_audit_status(tenant, db, audit_id, status="running")
            await db.commit()

        print(f"[BiasAudit] Starting audit {audit_id}")

        from engines.bias_audit.models import BiasAuditConfig, CategoryConfig, IntersectionalConfig
        from engines.bias_audit.dataset_parser import parse_csv_dataset
        from engines.bias_audit.engine import compute_bias_audit

        # Build config from preset + overrides
        categories_raw = config_data.get("categories") or (preset.get("categories") if preset else {})
        categories = {}
        for key, val in categories_raw.items():
            if isinstance(val, dict):
                categories[key] = CategoryConfig(
                    label=val.get("label", key),
                    groups=val.get("groups", []),
                )
            else:
                categories[key] = CategoryConfig(label=key, groups=[])

        intersectional_raw = config_data.get("intersectional") or (preset.get("intersectional") if preset else {})
        intersectional = IntersectionalConfig(
            required=intersectional_raw.get("required", False),
            cross=intersectional_raw.get("cross", []),
        )

        audit_config = BiasAuditConfig(
            preset_id=config_data.get("presetId", "custom"),
            preset_name=preset["name"] if preset else "Custom",
            mode=preset["mode"] if preset else config_data.get("mode", "quantitative_audit"),
            categories=categories,
            intersectional=intersectional,
            metrics=config_data.get("metrics") or (preset.get("metrics") if preset else ["selection_rate", "impact_ratio"]),
            threshold=config_data.get("threshold") if "threshold" in config_data else (preset.get("threshold") if preset else 0.80),
            small_sample_exclusion=config_data.get("smallSampleExclusion") if "smallSampleExclusion" in config_data else (preset.get("small_sample_exclusion") if preset else None),
            outcome_column=config_data.get("outcomeColumn", "selected"),
            column_mapping=config_data.get("columnMapping", {}),
            metadata=config_data.get("metadata", {}),
        )

        # Parse CSV
        records, unknown_count = parse_csv_dataset(
            csv_bytes=csv_bytes,
            column_mapping=audit_config.column_mapping,
            outcome_column=audit_config.outcome_column,
        )

        if not records:
            raise ValueError("No valid records found in dataset after parsing. Check column mapping and data.")

        print(f"[BiasAudit] Parsed {len(records)} records, {unknown_count} unknown")

        # Run computation
        result = compute_bias_audit(
            records=records,
            config=audit_config,
            unknown_count=unknown_count,
        )

        print(f"[BiasAudit] Computation complete: {result.flags_count} flags")

        # Store results
        results_dict = result.model_dump()

        # Flatten all group results for the per-row table
        all_rows = []
        for table in result.tables:
            for group_result in table.rows:
                all_rows.append(group_result.model_dump())

        async with get_db() as db:
            # Store per-group result rows
            await create_bias_audit_result_rows(tenant, db, audit_id, all_rows)

            # Store aggregate results as JSONB
            await update_bias_audit_status(
                tenant, db, audit_id,
                status="completed",
                results=results_dict,
            )
            await db.commit()

        print(f"[BiasAudit] Audit {audit_id} completed successfully")

    except Exception as e:
        print(f"[BiasAudit] Audit {audit_id} failed: {e}")
        traceback.print_exc()

        try:
            async with get_db() as db:
                await update_bias_audit_status(
                    tenant, db, audit_id,
                    status="failed",
                    error=str(e),
                )
                await db.commit()
        except Exception:
            pass


async def get_bias_audit_status_controller(
    audit_id: str,
    tenant: str,
) -> JSONResponse:
    """Get the status of a bias audit."""
    async with get_db() as db:
        audit = await get_bias_audit(tenant, db, audit_id)

    if not audit:
        raise HTTPException(status_code=404, detail=f"Audit {audit_id} not found")

    return JSONResponse(
        status_code=200,
        content={
            "auditId": audit["id"],
            "status": audit["status"],
            "presetName": audit["presetName"],
            "mode": audit["mode"],
            "error": audit["error"],
            "createdAt": audit["createdAt"],
            "updatedAt": audit["updatedAt"],
            "completedAt": audit["completedAt"],
        },
    )


async def get_bias_audit_results_controller(
    audit_id: str,
    tenant: str,
) -> JSONResponse:
    """Get full results of a completed bias audit."""
    async with get_db() as db:
        audit = await get_bias_audit(tenant, db, audit_id)
        if not audit:
            raise HTTPException(status_code=404, detail=f"Audit {audit_id} not found")

        if audit["status"] in ("pending", "running"):
            return JSONResponse(
                status_code=202,
                content={"auditId": audit_id, "status": audit["status"], "message": f"Audit is still {audit['status']}"},
            )

        if audit["status"] == "failed":
            raise HTTPException(status_code=500, detail=f"Audit failed: {audit['error']}")

        result_rows = await get_bias_audit_result_rows(tenant, db, audit_id)

    return JSONResponse(
        status_code=200,
        content={
            "auditId": audit["id"],
            "status": audit["status"],
            "presetId": audit["presetId"],
            "presetName": audit["presetName"],
            "mode": audit["mode"],
            "config": audit["config"],
            "results": audit["results"],
            "resultRows": result_rows,
            "createdAt": audit["createdAt"],
            "completedAt": audit["completedAt"],
            "createdBy": audit["createdBy"],
        },
    )


async def list_bias_audits_controller(
    tenant: str,
    org_id: Optional[str] = None,
    project_id: Optional[str] = None,
) -> JSONResponse:
    """List all bias audits for the tenant."""
    try:
        async with get_db() as db:
            audits = await list_bias_audits(tenant, db, org_id=org_id, project_id=project_id)
        return JSONResponse(status_code=200, content={"audits": audits})
    except Exception as e:
        error_str = str(e).lower()
        if "does not exist" in error_str or "relation" in error_str:
            return JSONResponse(status_code=200, content={"audits": []})
        raise HTTPException(status_code=500, detail=f"Failed to list audits: {e}")


async def delete_bias_audit_controller(
    audit_id: str,
    tenant: str,
) -> JSONResponse:
    """Delete a bias audit and its results."""
    try:
        async with get_db() as db:
            deleted = await delete_bias_audit(tenant, db, audit_id)
            await db.commit()

        if not deleted:
            raise HTTPException(status_code=404, detail=f"Audit {audit_id} not found")

        return JSONResponse(
            status_code=200,
            content={"message": "Bias audit deleted successfully", "auditId": audit_id},
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete audit: {e}")


async def get_csv_headers_controller(
    dataset: UploadFile,
) -> JSONResponse:
    """Parse CSV headers for column mapping UI."""
    from engines.bias_audit.dataset_parser import parse_csv_headers

    csv_bytes = await dataset.read()
    if not csv_bytes:
        raise HTTPException(status_code=400, detail="Empty dataset file")

    headers = parse_csv_headers(csv_bytes)
    return JSONResponse(status_code=200, content={"headers": headers})
