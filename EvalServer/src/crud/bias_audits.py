"""
CRUD operations for bias audits.

Tenant-isolated raw SQL with text() following the pattern from deepeval_scorers.py.
"""

from typing import List, Dict, Any, Optional
import re
import json
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

_TENANT_HASH_RE = re.compile(r"^[a-zA-Z0-9]{10}$")


def _validate_tenant(tenant: str) -> None:
    """Validate tenant hash format to prevent SQL injection."""
    if not _TENANT_HASH_RE.match(tenant):
        raise ValueError(f"Invalid tenant hash format: {tenant}")


async def create_bias_audit(
    tenant: str,
    db: AsyncSession,
    *,
    audit_id: str,
    org_id: str,
    project_id: Optional[str],
    preset_id: str,
    preset_name: str,
    mode: str,
    config: Dict[str, Any],
    created_by: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    """Create a new bias audit record."""
    _validate_tenant(tenant)
    result = await db.execute(
        text(
            f'''
            INSERT INTO "{tenant}".llm_evals_bias_audits
            (id, org_id, project_id, preset_id, preset_name, mode, status, config, created_by)
            VALUES
            (:id, :org_id, :project_id, :preset_id, :preset_name, :mode, 'pending', :config, :created_by)
            RETURNING id, org_id, project_id, preset_id, preset_name, mode, status,
                      config, results, error, created_at, updated_at, completed_at, created_by
            '''
        ),
        {
            "id": audit_id,
            "org_id": org_id,
            "project_id": project_id,
            "preset_id": preset_id,
            "preset_name": preset_name,
            "mode": mode,
            "config": json.dumps(config),
            "created_by": created_by,
        },
    )
    row = result.mappings().first()
    if not row:
        return None
    return _row_to_dict(row)


async def get_bias_audit(
    tenant: str,
    db: AsyncSession,
    audit_id: str,
) -> Optional[Dict[str, Any]]:
    """Get a single bias audit by ID."""
    _validate_tenant(tenant)
    result = await db.execute(
        text(
            f'''
            SELECT id, org_id, project_id, preset_id, preset_name, mode, status,
                   config, results, error, created_at, updated_at, completed_at, created_by
            FROM "{tenant}".llm_evals_bias_audits
            WHERE id = :id
            '''
        ),
        {"id": audit_id},
    )
    row = result.mappings().first()
    if not row:
        return None
    return _row_to_dict(row)


async def update_bias_audit_status(
    tenant: str,
    db: AsyncSession,
    audit_id: str,
    *,
    status: str,
    results: Optional[Dict[str, Any]] = None,
    error: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    """Update audit status, results, and/or error."""
    _validate_tenant(tenant)
    updates = ["status = :status", "updated_at = CURRENT_TIMESTAMP"]
    params: Dict[str, Any] = {"id": audit_id, "status": status}

    if results is not None:
        updates.append("results = :results")
        params["results"] = json.dumps(results)

    if error is not None:
        updates.append("error = :error")
        params["error"] = error

    if status in ("completed", "failed"):
        updates.append("completed_at = CURRENT_TIMESTAMP")

    result = await db.execute(
        text(
            f'''
            UPDATE "{tenant}".llm_evals_bias_audits
            SET {", ".join(updates)}
            WHERE id = :id
            RETURNING id, org_id, project_id, preset_id, preset_name, mode, status,
                      config, results, error, created_at, updated_at, completed_at, created_by
            '''
        ),
        params,
    )
    row = result.mappings().first()
    if not row:
        return None
    return _row_to_dict(row)


async def list_bias_audits(
    tenant: str,
    db: AsyncSession,
    org_id: Optional[str] = None,
    project_id: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """List bias audits with optional filtering."""
    _validate_tenant(tenant)
    where_clauses = []
    params: Dict[str, Any] = {}

    if org_id:
        where_clauses.append("org_id = :org_id")
        params["org_id"] = org_id
    if project_id:
        where_clauses.append("project_id = :project_id")
        params["project_id"] = project_id

    where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""

    result = await db.execute(
        text(
            f'''
            SELECT id, org_id, project_id, preset_id, preset_name, mode, status,
                   config, results, error, created_at, updated_at, completed_at, created_by
            FROM "{tenant}".llm_evals_bias_audits
            {where_sql}
            ORDER BY created_at DESC
            '''
        ),
        params if params else {},
    )
    rows = result.mappings().all()
    return [_row_to_dict(row) for row in rows]


async def delete_bias_audit(
    tenant: str,
    db: AsyncSession,
    audit_id: str,
) -> bool:
    """Delete a bias audit and its result rows (CASCADE)."""
    _validate_tenant(tenant)
    result = await db.execute(
        text(
            f'''
            DELETE FROM "{tenant}".llm_evals_bias_audits
            WHERE id = :id
            RETURNING id
            '''
        ),
        {"id": audit_id},
    )
    row = result.fetchone()
    return row is not None


async def create_bias_audit_result_rows(
    tenant: str,
    db: AsyncSession,
    audit_id: str,
    rows: List[Dict[str, Any]],
) -> int:
    """Bulk insert per-group result rows for an audit."""
    _validate_tenant(tenant)
    inserted = 0
    for row_data in rows:
        await db.execute(
            text(
                f'''
                INSERT INTO "{tenant}".llm_evals_bias_audit_results
                (audit_id, category_type, category_name, applicant_count,
                 selected_count, selection_rate, impact_ratio, excluded, flagged)
                VALUES
                (:audit_id, :category_type, :category_name, :applicant_count,
                 :selected_count, :selection_rate, :impact_ratio, :excluded, :flagged)
                '''
            ),
            {
                "audit_id": audit_id,
                "category_type": row_data["category_type"],
                "category_name": row_data["category_name"],
                "applicant_count": row_data["applicant_count"],
                "selected_count": row_data["selected_count"],
                "selection_rate": row_data["selection_rate"],
                "impact_ratio": row_data.get("impact_ratio"),
                "excluded": row_data.get("excluded", False),
                "flagged": row_data.get("flagged", False),
            },
        )
        inserted += 1
    return inserted


async def get_bias_audit_result_rows(
    tenant: str,
    db: AsyncSession,
    audit_id: str,
) -> List[Dict[str, Any]]:
    """Get all per-group result rows for an audit."""
    _validate_tenant(tenant)
    result = await db.execute(
        text(
            f'''
            SELECT id, audit_id, category_type, category_name, applicant_count,
                   selected_count, selection_rate, impact_ratio, excluded, flagged, created_at
            FROM "{tenant}".llm_evals_bias_audit_results
            WHERE audit_id = :audit_id
            ORDER BY id
            '''
        ),
        {"audit_id": audit_id},
    )
    rows = result.mappings().all()
    return [
        {
            "id": row["id"],
            "auditId": row["audit_id"],
            "categoryType": row["category_type"],
            "categoryName": row["category_name"],
            "applicantCount": row["applicant_count"],
            "selectedCount": row["selected_count"],
            "selectionRate": float(row["selection_rate"]),
            "impactRatio": float(row["impact_ratio"]) if row["impact_ratio"] is not None else None,
            "excluded": row["excluded"],
            "flagged": row["flagged"],
            "createdAt": row["created_at"].isoformat() if row["created_at"] else None,
        }
        for row in rows
    ]


def _row_to_dict(row) -> Dict[str, Any]:
    """Convert a database row to a camelCase dict for API responses."""
    return {
        "id": row["id"],
        "orgId": row["org_id"],
        "projectId": row["project_id"],
        "presetId": row["preset_id"],
        "presetName": row["preset_name"],
        "mode": row["mode"],
        "status": row["status"],
        "config": row["config"] if isinstance(row["config"], dict) else (json.loads(row["config"]) if row["config"] else {}),
        "results": row["results"] if isinstance(row["results"], dict) else (json.loads(row["results"]) if row["results"] else None),
        "error": row["error"],
        "createdAt": row["created_at"].isoformat() if row["created_at"] else None,
        "updatedAt": row["updated_at"].isoformat() if row["updated_at"] else None,
        "completedAt": row["completed_at"].isoformat() if row["completed_at"] else None,
        "createdBy": row["created_by"],
    }
