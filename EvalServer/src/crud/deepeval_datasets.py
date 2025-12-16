"""
CRUD for user datasets (tenant-scoped).
"""
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text


def _get_schema_name(tenant: str) -> str:
    """
    Resolve the underlying Postgres schema for a given tenant.
    """
    return "a4ayc80OGd" if tenant == "default" else tenant


async def _ensure_table(tenant: str, db: AsyncSession) -> None:
    schema = _get_schema_name(tenant)
    await db.execute(
        text(
            f'''
            CREATE TABLE IF NOT EXISTS "{schema}".deepeval_user_datasets (
              id SERIAL PRIMARY KEY,
              name VARCHAR(255) NOT NULL,
              path TEXT NOT NULL,
              size BIGINT NOT NULL DEFAULT 0,
              prompt_count INTEGER DEFAULT 0,
              tenant VARCHAR(255) NOT NULL,
              created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            '''
        )
    )
    # Add tenant column if it doesn't exist (for existing tables)
    await db.execute(
        text(
            f'''
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_schema = '{schema}' 
                    AND table_name = 'deepeval_user_datasets' 
                    AND column_name = 'tenant'
                ) THEN
                    ALTER TABLE "{schema}".deepeval_user_datasets 
                    ADD COLUMN tenant VARCHAR(255);
                    UPDATE "{schema}".deepeval_user_datasets 
                    SET tenant = '{tenant}' WHERE tenant IS NULL;
                    ALTER TABLE "{schema}".deepeval_user_datasets 
                    ALTER COLUMN tenant SET NOT NULL;
                END IF;
            END $$;
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
    schema = _get_schema_name(tenant)
    res = await db.execute(
        text(
            f'''
            INSERT INTO "{schema}".deepeval_user_datasets (name, path, size, prompt_count, tenant)
            VALUES (:name, :path, :size, :prompt_count, :tenant)
            RETURNING id, name, path, size, prompt_count, tenant, created_at;
            '''
        ),
        {"name": name, "path": path, "size": int(size), "prompt_count": int(prompt_count), "tenant": tenant},
    )
    row = res.mappings().first()
    return {
        "id": row["id"],
        "name": row["name"],
        "path": row["path"],
        "size": row["size"],
        "promptCount": row["prompt_count"],
        "tenant": row["tenant"],
        "createdAt": row["created_at"].isoformat() if row["created_at"] else None,
    }


async def list_user_datasets(tenant: str, db: AsyncSession) -> List[Dict[str, Any]]:
    await _ensure_table(tenant, db)
    schema = _get_schema_name(tenant)
    res = await db.execute(
        text(
            f'''
            SELECT id, name, path, size, prompt_count, tenant, created_at
            FROM "{schema}".deepeval_user_datasets
            WHERE tenant = :tenant
            ORDER BY created_at DESC;
            '''
        ),
        {"tenant": tenant},
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
                "tenant": r["tenant"],
                "createdAt": r["created_at"].isoformat() if r["created_at"] else None,
            }
        )
    return items


async def delete_user_datasets(tenant: str, db: AsyncSession, paths: List[str]) -> None:
    await _ensure_table(tenant, db)
    schema = _get_schema_name(tenant)
    if not paths:
        return
    
    # Create placeholders for the IN clause
    placeholders = ", ".join([f":path_{i}" for i in range(len(paths))])
    params = {f"path_{i}": path for i, path in enumerate(paths)}
    params["tenant"] = tenant
    
    await db.execute(
        text(
            f'''
            DELETE FROM "{schema}".deepeval_user_datasets
            WHERE path IN ({placeholders}) AND tenant = :tenant;
            '''
        ),
        params
    )


