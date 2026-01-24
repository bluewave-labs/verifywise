"""
CRUD for user datasets (tenant-scoped).
"""
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text


async def create_user_dataset(
    tenant: str,
    db: AsyncSession,
    *,
    name: str,
    path: str,
    size: int,
    org_id: str,
    prompt_count: int = 0,
    dataset_type: str = "chatbot",
    turn_type: str = "single-turn",
    created_by: Optional[str] = None,
) -> Dict[str, Any]:
    res = await db.execute(
        text(
            f'''
            INSERT INTO "{tenant}".llm_evals_datasets (name, path, size, prompt_count, dataset_type, turn_type, org_id, created_by)
            VALUES (:name, :path, :size, :prompt_count, :dataset_type, :turn_type, :org_id, :created_by)
            RETURNING id, name, path, size, prompt_count, dataset_type, turn_type, created_at, created_by;
            '''
        ),
        {
            "name": name,
            "path": path,
            "size": int(size),
            "prompt_count": int(prompt_count),
            "dataset_type": dataset_type,
            "turn_type": turn_type,
            "org_id": org_id,
            "created_by": created_by,
        },
    )
    row = res.mappings().first()
    return {
        "id": row["id"],
        "name": row["name"],
        "path": row["path"],
        "size": row["size"],
        "promptCount": row["prompt_count"],
        "datasetType": row["dataset_type"],
        "turnType": row["turn_type"],
        "createdAt": row["created_at"].isoformat() if row["created_at"] else None,
        "createdBy": row["created_by"],
    }


async def list_user_datasets(
    tenant: str,
    db: AsyncSession,
    org_id: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    List user datasets for a tenant (optionally filtered by org_id).
    Multi-tenancy is handled by the schema name.

    Note: Handles both legacy schema (tenant column) and new schema (org_id column).
    """
    # First, check which columns exist in the table
    cols_result = await db.execute(
        text("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = :schema
            AND table_name = 'llm_evals_datasets'
        """),
        {"schema": tenant}
    )
    existing_cols = {row[0] for row in cols_result.fetchall()}

    # Use org_id if it exists, otherwise fall back to tenant column
    has_org_id = "org_id" in existing_cols
    has_created_by = "created_by" in existing_cols

    params: Dict[str, Any] = {}
    where_clause = ""

    if org_id and has_org_id:
        where_clause = "WHERE org_id = :org_id"
        params["org_id"] = org_id

    # Build SELECT clause based on available columns
    select_cols = ["id", "name", "path", "size", "prompt_count", "dataset_type", "turn_type", "created_at"]
    if has_org_id:
        select_cols.append("org_id")
    if has_created_by:
        select_cols.append("created_by")

    res = await db.execute(
        text(
            f'''
            SELECT {", ".join(select_cols)}
            FROM "{tenant}".llm_evals_datasets
            {where_clause}
            ORDER BY created_at DESC;
            '''
        ),
        params if params else {},
    )
    items: List[Dict[str, Any]] = []
    for r in res.mappings().all():
        item = {
            "id": r["id"],
            "name": r["name"],
            "path": r["path"],
            "size": r["size"],
            "promptCount": r["prompt_count"] if r["prompt_count"] else 0,
            "datasetType": r["dataset_type"] if r["dataset_type"] else "chatbot",
            "turnType": r["turn_type"] if r["turn_type"] else None,
            "orgId": r.get("org_id") if has_org_id else None,
            "createdAt": r["created_at"].isoformat() if r["created_at"] else None,
            "createdBy": r.get("created_by") if has_created_by else None,
        }
        items.append(item)
    return items


async def delete_user_datasets(tenant: str, db: AsyncSession, paths: List[str]) -> None:
    if not paths:
        return
    
    # Create placeholders for the IN clause
    placeholders = ", ".join([f":path_{i}" for i in range(len(paths))])
    params = {f"path_{i}": path for i, path in enumerate(paths)}
    params["tenant"] = tenant
    
    await db.execute(
        text(
            f'''
            DELETE FROM "{tenant}".llm_evals_datasets
            WHERE path IN ({placeholders});
            '''
        ),
        params
    )


