"""
CRUD operations for DeepEval Projects.
"""

import json
from typing import List, Dict, Any, Optional
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime


def _get_schema_name(tenant: str) -> str:
    """
    Resolve the underlying Postgres schema for a given tenant.
    """
    return "a4ayc80OGd" if tenant == "default" else tenant


async def create_project(
    project_id: str,
    name: str,
    description: str,
    org_id: str,
    tenant: str,
    created_by: str,
    db: AsyncSession
) -> Optional[Dict[str, Any]]:
    """
    Create a new DeepEval project (simplified - just name and description).

    Args:
        project_id: Unique project identifier
        name: Project name
        description: Project description
        tenant: Tenant ID (used for schema selection)
        created_by: Creator identifier
        db: Database session

    Returns:
        Created project as dictionary, or None if failed
    """
    schema_name = _get_schema_name(tenant)

    if org_id:
        result = await db.execute(
            text(f'''
                INSERT INTO "{schema_name}".deepeval_projects
                (id, name, description, org_id, tenant, created_by)
                VALUES (:id, :name, :description, :org_id, :tenant, :created_by)
                RETURNING id, name, description, org_id, created_at, updated_at, created_by
            '''),
            {
                "id": project_id,
                "name": name,
                "description": description,
                "org_id": org_id,
                "tenant": tenant,
                "created_by": created_by
            }
        )
    else:
        result = await db.execute(
            text(f'''
                INSERT INTO "{schema_name}".deepeval_projects
                (id, name, description, tenant, created_by)
                VALUES (:id, :name, :description, :tenant, :created_by)
                RETURNING id, name, description, NULL::varchar as org_id, created_at, updated_at, created_by
            '''),
            {
                "id": project_id,
                "name": name,
                "description": description,
                "tenant": tenant,
                "created_by": created_by
            }
        )

    row = result.mappings().first()
    if row:
        return {
            "id": row["id"],
            "name": row["name"],
            "description": row["description"],
            "orgId": row["org_id"],
            "createdAt": row["created_at"].isoformat() if row["created_at"] else None,
            "updatedAt": row["updated_at"].isoformat() if row["updated_at"] else None,
            "createdBy": row["created_by"]
        }
    return None


async def get_all_projects(tenant: str, db: AsyncSession) -> List[Dict[str, Any]]:
    """
    Get all projects for a tenant.

    Args:
        tenant: Tenant ID (used for schema selection and filtering)
        db: Database session

    Returns:
        List of projects
    """
    schema_name = _get_schema_name(tenant)

    result = await db.execute(
        text(f'''
            SELECT id, name, description, org_id, tenant, created_at, updated_at, created_by
            FROM "{schema_name}".deepeval_projects
            WHERE tenant = :tenant
            ORDER BY created_at DESC
        '''),
        {"tenant": tenant}
    )

    rows = result.mappings().all()
    projects = []
    for row in rows:
        projects.append({
            "id": row["id"],
            "name": row["name"],
            "description": row["description"],
            "orgId": row["org_id"],
            "tenant": row["tenant"],
            "createdAt": row["created_at"].isoformat() if row["created_at"] else None,
            "updatedAt": row["updated_at"].isoformat() if row["updated_at"] else None,
            "createdBy": row["created_by"]
        })
    return projects


async def get_project_by_id(
    project_id: str,
    tenant: str,
    db: AsyncSession
) -> Optional[Dict[str, Any]]:
    """
    Get a project by ID.

    Args:
        project_id: Project ID
        tenant: Tenant ID (used for schema selection and filtering)
        db: Database session

    Returns:
        Project as dictionary, or None if not found
    """
    schema_name = _get_schema_name(tenant)

    result = await db.execute(
        text(f'''
            SELECT id, name, description, tenant, created_at, updated_at, created_by
            FROM "{schema_name}".deepeval_projects
            WHERE id = :id AND tenant = :tenant
        '''),
        {"id": project_id, "tenant": tenant}
    )

    row = result.mappings().first()
    if row:
        return {
            "id": row["id"],
            "name": row["name"],
            "description": row["description"],
            "tenant": row["tenant"],
            "createdAt": row["created_at"].isoformat() if row["created_at"] else None,
            "updatedAt": row["updated_at"].isoformat() if row["updated_at"] else None,
            "createdBy": row["created_by"]
        }
    return None


async def update_project(
    project_id: str,
    name: Optional[str],
    description: Optional[str],
    tenant: str,
    db: AsyncSession
) -> Optional[Dict[str, Any]]:
    """
    Update a project (simplified - only name and description).

    Args:
        project_id: Project ID
        name: New name (optional)
        description: New description (optional)
        tenant: Tenant ID (used for schema selection and filtering)
        db: Database session

    Returns:
        Updated project as dictionary, or None if not found
    """
    schema_name = _get_schema_name(tenant)

    # Build update query dynamically based on provided fields
    updates = []
    params = {"id": project_id, "tenant": tenant}

    if name is not None:
        updates.append("name = :name")
        params["name"] = name

    if description is not None:
        updates.append("description = :description")
        params["description"] = description

    if not updates:
        # Nothing to update, just return existing project
        return await get_project_by_id(project_id, tenant, db)

    updates.append("updated_at = CURRENT_TIMESTAMP")

    result = await db.execute(
        text(f'''
            UPDATE "{schema_name}".deepeval_projects
            SET {", ".join(updates)}
            WHERE id = :id AND tenant = :tenant
            RETURNING id, name, description, tenant, created_at, updated_at, created_by
        '''),
        params
    )

    row = result.mappings().first()
    if row:
        return {
            "id": row["id"],
            "name": row["name"],
            "description": row["description"],
            "tenant": row["tenant"],
            "createdAt": row["created_at"].isoformat() if row["created_at"] else None,
            "updatedAt": row["updated_at"].isoformat() if row["updated_at"] else None,
            "createdBy": row["created_by"]
        }
    return None


async def delete_project(
    project_id: str,
    tenant: str,
    db: AsyncSession
) -> bool:
    """
    Delete a project.

    Args:
        project_id: Project ID
        tenant: Tenant ID (used for schema selection and filtering)
        db: Database session

    Returns:
        True if deleted, False if not found
    """
    schema_name = _get_schema_name(tenant)

    result = await db.execute(
        text(f'''
            DELETE FROM "{schema_name}".deepeval_projects
            WHERE id = :id AND tenant = :tenant
            RETURNING id
        '''),
        {"id": project_id, "tenant": tenant}
    )

    row = result.fetchone()
    return row is not None
