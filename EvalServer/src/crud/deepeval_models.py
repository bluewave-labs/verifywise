"""
CRUD operations for DeepEval models (saved model configurations).
"""

from typing import List, Dict, Any, Optional
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def list_models(
    tenant: str,
    db: AsyncSession,
    org_id: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    List saved models for a tenant (optionally filtered by org_id).
    """

    params: Dict[str, Any] = {}

    # Build WHERE clause - org_id filter is optional
    if org_id:
        where_clause = "WHERE org_id = :org_id"
        params["org_id"] = org_id
    else:
        where_clause = ""

    result = await db.execute(
        text(
            f'''
            SELECT id,
                   org_id,
                   name,
                   provider,
                   endpoint_url,
                   created_at,
                   updated_at,
                   created_by
            FROM "{tenant}".deepeval_models
            {where_clause}
            ORDER BY created_at DESC
            '''
        ),
        params if params else {},
    )

    rows = result.mappings().all()
    models: List[Dict[str, Any]] = []
    for row in rows:
        models.append(
            {
                "id": row["id"],
                "orgId": row["org_id"],
                "name": row["name"],
                "provider": row["provider"],
                "endpointUrl": row["endpoint_url"],
                "createdAt": row["created_at"].isoformat() if row["created_at"] else None,
                "updatedAt": row["updated_at"].isoformat() if row["updated_at"] else None,
                "createdBy": row["created_by"],
            }
        )
    return models


async def create_model(
    model_id: str,
    *,
    org_id: Optional[str],
    name: str,
    provider: str,
    endpoint_url: Optional[str],
    tenant: str,
    created_by: Optional[str],
    db: AsyncSession,
) -> Optional[Dict[str, Any]]:
    """
    Create a new saved model configuration.
    """

    result = await db.execute(
        text(
            f'''
            INSERT INTO "{tenant}".deepeval_models
            (id, org_id, name, provider, endpoint_url, created_by)
            VALUES
            (:id, :org_id, :name, :provider, :endpoint_url, :created_by)
            RETURNING id, org_id, name, provider, endpoint_url, created_at, updated_at, created_by
            '''
        ),
        {
            "id": model_id,
            "org_id": org_id,
            "name": name,
            "provider": provider,
            "endpoint_url": endpoint_url,
            "created_by": created_by,
        },
    )

    row = result.mappings().first()
    if not row:
        return None

    return {
        "id": row["id"],
        "orgId": row["org_id"],
        "name": row["name"],
        "provider": row["provider"],
        "endpointUrl": row["endpoint_url"],
        "createdAt": row["created_at"].isoformat() if row["created_at"] else None,
        "updatedAt": row["updated_at"].isoformat() if row["updated_at"] else None,
        "createdBy": row["created_by"],
    }


async def update_model(
    model_id: str,
    *,
    tenant: str,
    name: Optional[str] = None,
    provider: Optional[str] = None,
    endpoint_url: Optional[str] = None,
    db: AsyncSession,
) -> Optional[Dict[str, Any]]:
    """
    Update an existing saved model.
    """

    updates = []
    params: Dict[str, Any] = {"id": model_id}

    if name is not None:
        updates.append("name = :name")
        params["name"] = name
    if provider is not None:
        updates.append("provider = :provider")
        params["provider"] = provider
    if endpoint_url is not None:
        updates.append("endpoint_url = :endpoint_url")
        params["endpoint_url"] = endpoint_url

    if not updates:
        # Nothing to update, just return current row
        result = await db.execute(
            text(
                f'''
                SELECT id, org_id, name, provider, endpoint_url, created_at, updated_at, created_by
                FROM "{tenant}".deepeval_models
                WHERE id = :id
                '''
            ),
            params,
        )
    else:
        updates.append("updated_at = CURRENT_TIMESTAMP")
        result = await db.execute(
            text(
                f'''
                UPDATE "{tenant}".deepeval_models
                SET {", ".join(updates)}
                WHERE id = :id
                RETURNING id, org_id, name, provider, endpoint_url, created_at, updated_at, created_by
                '''
            ),
            params,
        )

    row = result.mappings().first()
    if not row:
        return None

    return {
        "id": row["id"],
        "orgId": row["org_id"],
        "name": row["name"],
        "provider": row["provider"],
        "endpointUrl": row["endpoint_url"],
        "createdAt": row["created_at"].isoformat() if row["created_at"] else None,
        "updatedAt": row["updated_at"].isoformat() if row["updated_at"] else None,
        "createdBy": row["created_by"],
    }


async def get_model_by_id(
    model_id: str,
    *,
    tenant: str,
    db: AsyncSession,
) -> Optional[Dict[str, Any]]:
    """
    Get a single model by ID.
    """

    result = await db.execute(
        text(
            f'''
            SELECT id,
                   org_id,
                   name,
                   provider,
                   endpoint_url,
                   created_at,
                   updated_at,
                   created_by
            FROM "{tenant}".deepeval_models
            WHERE id = :id
            '''
        ),
        {"id": model_id},
    )

    row = result.mappings().first()
    if not row:
        return None

    return {
        "id": row["id"],
        "orgId": row["org_id"],
        "name": row["name"],
        "provider": row["provider"],
        "endpointUrl": row["endpoint_url"],
        "createdAt": row["created_at"].isoformat() if row["created_at"] else None,
        "updatedAt": row["updated_at"].isoformat() if row["updated_at"] else None,
        "createdBy": row["created_by"],
    }


async def delete_model(
    model_id: str,
    *,
    tenant: str,
    db: AsyncSession,
) -> bool:
    """
    Delete a model by ID.
    """

    result = await db.execute(
        text(
            f'''
            DELETE FROM "{tenant}".deepeval_models
            WHERE id = :id
            RETURNING id
            '''
        ),
        {"id": model_id},
    )

    row = result.fetchone()
    return row is not None
