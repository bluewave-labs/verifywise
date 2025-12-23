"""
CRUD operations for DeepEval scorers (metric definitions).
"""

from typing import List, Dict, Any, Optional
import json
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime


async def list_scorers(
  tenant: str,
  db: AsyncSession,
  org_id: Optional[str] = None,
) -> List[Dict[str, Any]]:
  """
  List scorers for a tenant (optionally filtered by org_id).
  Multi-tenancy is handled by the schema name, not a tenant column.
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
             description,
             type,
             metric_key,
             config,
             enabled,
             default_threshold,
             weight,
             created_at,
             updated_at,
             created_by
      FROM "{tenant}".deepeval_scorers
      {where_clause}
      ORDER BY created_at DESC
      '''
    ),
    params if params else {},
  )

  rows = result.mappings().all()
  scorers: List[Dict[str, Any]] = []
  for row in rows:
    scorers.append(
      {
        "id": row["id"],
        "orgId": row["org_id"],
        "name": row["name"],
        "description": row["description"],
        "type": row["type"],
        "metricKey": row["metric_key"],
        "config": row["config"] or {},
        "enabled": row["enabled"],
        "defaultThreshold": float(row["default_threshold"]) if row["default_threshold"] is not None else None,
        "weight": float(row["weight"]) if row["weight"] is not None else None,
        "createdAt": row["created_at"].isoformat() if row["created_at"] else None,
        "updatedAt": row["updated_at"].isoformat() if row["updated_at"] else None,
        "createdBy": row["created_by"],
      }
    )
  return scorers


async def create_scorer(
  scorer_id: str,
  *,
  org_id: Optional[str],
  name: str,
  description: Optional[str],
  scorer_type: str,
  metric_key: str,
  config: Dict[str, Any],
  enabled: bool,
  default_threshold: Optional[float],
  weight: Optional[float],
  tenant: str,
  created_by: Optional[str],
  db: AsyncSession,
) -> Optional[Dict[str, Any]]:
  """
  Create a new scorer definition.
  """

  result = await db.execute(
    text(
      f'''
      INSERT INTO "{tenant}".deepeval_scorers
      (id, org_id, name, description, type, metric_key, config, enabled,
       default_threshold, weight, created_by)
      VALUES
      (:id, :org_id, :name, :description, :type, :metric_key, :config, :enabled,
       :default_threshold, :weight, :created_by)
      RETURNING id, org_id, name, description, type, metric_key, config, enabled,
                default_threshold, weight, created_at, updated_at, created_by
      '''
    ),
    {
      "id": scorer_id,
      "org_id": org_id,
      "name": name,
      "description": description,
      "type": scorer_type,
      "metric_key": metric_key,
      "config": json.dumps(config or {}),
      "enabled": enabled,
      "default_threshold": default_threshold,
      "weight": weight,
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
    "description": row["description"],
    "type": row["type"],
    "metricKey": row["metric_key"],
    "config": row["config"] or {},
    "enabled": row["enabled"],
    "defaultThreshold": float(row["default_threshold"]) if row["default_threshold"] is not None else None,
    "weight": float(row["weight"]) if row["weight"] is not None else None,
    "createdAt": row["created_at"].isoformat() if row["created_at"] else None,
    "updatedAt": row["updated_at"].isoformat() if row["updated_at"] else None,
    "createdBy": row["created_by"],
  }


async def update_scorer(
  scorer_id: str,
  *,
  tenant: str,
  name: Optional[str] = None,
  description: Optional[str] = None,
  scorer_type: Optional[str] = None,
  metric_key: Optional[str] = None,
  config: Optional[Dict[str, Any]] = None,
  enabled: Optional[bool] = None,
  default_threshold: Optional[float] = None,
  weight: Optional[float] = None,
  db: AsyncSession,
) -> Optional[Dict[str, Any]]:
  """
  Update an existing scorer.
  """

  updates = []
  params: Dict[str, Any] = {"id": scorer_id}

  if name is not None:
    updates.append("name = :name")
    params["name"] = name
  if description is not None:
    updates.append("description = :description")
    params["description"] = description
  if scorer_type is not None:
    updates.append("type = :type")
    params["type"] = scorer_type
  if metric_key is not None:
    updates.append("metric_key = :metric_key")
    params["metric_key"] = metric_key
  if config is not None:
    updates.append("config = :config")
    params["config"] = json.dumps(config)
  if enabled is not None:
    updates.append("enabled = :enabled")
    params["enabled"] = enabled
  if default_threshold is not None:
    updates.append("default_threshold = :default_threshold")
    params["default_threshold"] = default_threshold
  if weight is not None:
    updates.append("weight = :weight")
    params["weight"] = weight

  if not updates:
    # Nothing to update, just return current row
    result = await db.execute(
      text(
        f'''
        SELECT id, org_id, name, description, type, metric_key, config, enabled,
               default_threshold, weight, created_at, updated_at, created_by
        FROM "{tenant}".deepeval_scorers
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
        UPDATE "{tenant}".deepeval_scorers
        SET {", ".join(updates)}
        WHERE id = :id
        RETURNING id, org_id, name, description, type, metric_key, config, enabled,
                  default_threshold, weight, created_at, updated_at, created_by
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
    "description": row["description"],
    "type": row["type"],
    "metricKey": row["metric_key"],
    "config": row["config"] or {},
    "enabled": row["enabled"],
    "defaultThreshold": float(row["default_threshold"]) if row["default_threshold"] is not None else None,
    "weight": float(row["weight"]) if row["weight"] is not None else None,
    "createdAt": row["created_at"].isoformat() if row["created_at"] else None,
    "updatedAt": row["updated_at"].isoformat() if row["updated_at"] else None,
    "createdBy": row["created_by"],
  }


async def get_scorer_by_id(
  scorer_id: str,
  *,
  tenant: str,
  db: AsyncSession,
) -> Optional[Dict[str, Any]]:
  """
  Get a single scorer by ID.
  """

  result = await db.execute(
    text(
      f'''
      SELECT id,
             org_id,
             name,
             description,
             type,
             metric_key,
             config,
             enabled,
             default_threshold,
             weight,
             created_at,
             updated_at,
             created_by
      FROM "{tenant}".deepeval_scorers
      WHERE id = :id
      '''
    ),
    {"id": scorer_id},
  )

  row = result.mappings().first()
  if not row:
    return None

  return {
    "id": row["id"],
    "orgId": row["org_id"],
    "name": row["name"],
    "description": row["description"],
    "type": row["type"],
    "metricKey": row["metric_key"],
    "config": row["config"] or {},
    "enabled": row["enabled"],
    "defaultThreshold": float(row["default_threshold"]) if row["default_threshold"] is not None else None,
    "weight": float(row["weight"]) if row["weight"] is not None else None,
    "createdAt": row["created_at"].isoformat() if row["created_at"] else None,
    "updatedAt": row["updated_at"].isoformat() if row["updated_at"] else None,
    "createdBy": row["created_by"],
  }


async def delete_scorer(
  scorer_id: str,
  *,
  tenant: str,
  db: AsyncSession,
) -> bool:
  """
  Delete a scorer by ID.
  """

  result = await db.execute(
    text(
      f'''
      DELETE FROM "{tenant}".deepeval_scorers
      WHERE id = :id
      RETURNING id
      '''
    ),
    {"id": scorer_id},
  )

  row = result.fetchone()
  return row is not None


