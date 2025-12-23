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
) -> Dict[str, Any]:
    res = await db.execute(
        text(
            f'''
            INSERT INTO "{tenant}".deepeval_user_datasets (name, path, size, prompt_count, dataset_type, turn_type, org_id)
            VALUES (:name, :path, :size, :prompt_count, :dataset_type, :turn_type, :org_id)
            RETURNING id, name, path, size, prompt_count, dataset_type, turn_type, created_at;
            '''
        ),
        {"name": name, "path": path, "size": int(size), "prompt_count": int(prompt_count), "dataset_type": dataset_type, "turn_type": turn_type, "org_id": org_id},
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
    }


async def list_user_datasets(
    tenant: str,
    db: AsyncSession,
    org_id: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    List user datasets for a tenant (optionally filtered by org_id).
    Multi-tenancy is handled by the schema name.
    """
    params: Dict[str, Any] = {}
    
    # Build WHERE clause - org_id filter is optional
    if org_id:
        where_clause = "WHERE org_id = :org_id"
        params["org_id"] = org_id
    else:
        where_clause = ""
    
    res = await db.execute(
        text(
            f'''
            SELECT id, name, path, size, prompt_count, dataset_type, turn_type, org_id, created_at
            FROM "{tenant}".deepeval_user_datasets
            {where_clause}
            ORDER BY created_at DESC;
            '''
        ),
        params if params else {},
    )
    items: List[Dict[str, Any]] = []
    for r in res.mappings().all():
        items.append(
            {
                "id": r["id"],
                "name": r["name"],
                "path": r["path"],
                "size": r["size"],
                "promptCount": r["prompt_count"] if r["prompt_count"] else 0,
                "datasetType": r["dataset_type"] if r["dataset_type"] else "chatbot",
                "turnType": r["turn_type"] if r["turn_type"] else None,
                "orgId": r["org_id"],
                "createdAt": r["created_at"].isoformat() if r["created_at"] else None,
            }
        )
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
            DELETE FROM "{tenant}".deepeval_user_datasets
            WHERE path IN ({placeholders});
            '''
        ),
        params
    )


