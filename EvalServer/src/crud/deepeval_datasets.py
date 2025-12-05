"""
CRUD for user datasets (tenant-scoped).
"""
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text


def _schema_for_tenant(tenant: str) -> str:
    return "a4ayc80OGd" if tenant == "default" else tenant


async def _ensure_table(tenant: str, db: AsyncSession) -> None:
    schema = _schema_for_tenant(tenant)
    await db.execute(
        text(
            f'''
            CREATE TABLE IF NOT EXISTS "{schema}".deepeval_user_datasets (
              id SERIAL PRIMARY KEY,
              name VARCHAR(255) NOT NULL,
              path TEXT NOT NULL,
              size BIGINT NOT NULL DEFAULT 0,
              prompt_count INTEGER DEFAULT 0,
              created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            '''
        )
    )


async def create_user_dataset(
    tenant: str,
    db: AsyncSession,
    *,
    name: str,
    path: str,
    size: int,
    prompt_count: int = 0,
) -> Dict[str, Any]:
    await _ensure_table(tenant, db)
    schema = _schema_for_tenant(tenant)
    res = await db.execute(
        text(
            f'''
            INSERT INTO "{schema}".deepeval_user_datasets (name, path, size, prompt_count)
            VALUES (:name, :path, :size, :prompt_count)
            RETURNING id, name, path, size, prompt_count, created_at;
            '''
        ),
        {"name": name, "path": path, "size": int(size), "prompt_count": int(prompt_count)},
    )
    row = res.mappings().first()
    return {
        "id": row["id"],
        "name": row["name"],
        "path": row["path"],
        "size": row["size"],
        "promptCount": row["prompt_count"],
        "createdAt": row["created_at"].isoformat() if row["created_at"] else None,
    }


async def list_user_datasets(tenant: str, db: AsyncSession) -> List[Dict[str, Any]]:
    await _ensure_table(tenant, db)
    schema = _schema_for_tenant(tenant)
    res = await db.execute(
        text(
            f'''
            SELECT id, name, path, size, prompt_count, created_at
            FROM "{schema}".deepeval_user_datasets
            ORDER BY created_at DESC;
            '''
        )
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
                "createdAt": r["created_at"].isoformat() if r["created_at"] else None,
            }
        )
    return items


async def delete_user_datasets(tenant: str, db: AsyncSession, paths: List[str]) -> None:
    await _ensure_table(tenant, db)
    schema = _schema_for_tenant(tenant)
    if not paths:
        return
    
    # Create placeholders for the IN clause
    placeholders = ", ".join([f":path_{i}" for i in range(len(paths))])
    params = {f"path_{i}": path for i, path in enumerate(paths)}
    
    await db.execute(
        text(
            f'''
            DELETE FROM "{schema}".deepeval_user_datasets
            WHERE path IN ({placeholders});
            '''
        ),
        params
    )


