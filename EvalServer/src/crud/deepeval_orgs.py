"""
CRUD for DeepEval organizations (tenant-scoped).
"""
from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text


async def create_org(
    org_id: str,
    name: str,
    tenant: str,
    db: AsyncSession,
) -> Optional[Dict[str, Any]]:
    result = await db.execute(
        text(
            f'''
            INSERT INTO "{tenant}".deepeval_organizations (id, name)
            VALUES (:id, :name)
            ON CONFLICT (name) DO NOTHING
            RETURNING id, name, created_at
            '''
        ),
        {"id": org_id, "name": name},
    )
    row = result.mappings().first()
    if row:
        return {
            "id": row["id"],
            "name": row["name"],
            "createdAt": row["created_at"].isoformat() if row["created_at"] else None,
        }
    # If conflict (existing), fetch it
    res2 = await db.execute(
        text(f'SELECT id, name, created_at FROM "{tenant}".deepeval_organizations WHERE name=:name'),
        {"name": name},
    )
    row2 = res2.mappings().first()
    if row2:
        return {
            "id": row2["id"],
            "name": row2["name"],
            "createdAt": row2["created_at"].isoformat() if row2["created_at"] else None,
        }
    return None


async def get_all_orgs(tenant: str, db: AsyncSession) -> List[Dict[str, Any]]:
    res = await db.execute(
        text(f'SELECT id, name, created_at FROM "{tenant}".deepeval_organizations ORDER BY created_at DESC')
    )
    orgs: List[Dict[str, Any]] = []
    for row in res.mappings().all():
        orgs.append(
            {
                "id": row["id"],
                "name": row["name"],
                "createdAt": row["created_at"].isoformat() if row["created_at"] else None,
                # "member_ids": row["member_ids"],
            }
        )
    return orgs


async def get_projects_for_org(org_id: str, tenant: str, db: AsyncSession) -> List[str]:
    res = await db.execute(
        text(f'SELECT id FROM "{tenant}".deepeval_projects WHERE org_id = :org_id ORDER BY created_at DESC'),
        {"org_id": org_id},
    )
    return [row[0] for row in res.fetchall()]


async def update_org(
    org_id: str,
    name: str,
    member_ids: Optional[List[int]],
    tenant: str,
    db: AsyncSession,
) -> Optional[Dict[str, Any]]:
    """
    Update an organization's name and member_ids.
    """
    result = await db.execute(
        text(
            f'''
            UPDATE "{tenant}".deepeval_organizations
            SET name = :name
            WHERE id = :id
            RETURNING id, name, created_at
            '''
        ),
        {"id": org_id, "name": name},
    )
    row = result.mappings().first()
    if row:
        return {
            "id": row["id"],
            "name": row["name"],
            "createdAt": row["created_at"].isoformat() if row["created_at"] else None,
            # "member_ids": row["member_ids"],
        }
    return None


async def delete_org(org_id: str, tenant: str, db: AsyncSession) -> bool:
    """
    Delete an organization by ID. Returns True if a row was removed.
    """
    res = await db.execute(
        text(f'DELETE FROM "{tenant}".deepeval_organizations WHERE id = :id'),
        {"id": org_id},
    )
    # res.rowcount may be None on some DB backends; treat None as 0
    return bool(getattr(res, "rowcount", 0))


