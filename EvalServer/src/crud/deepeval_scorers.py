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
  List scorers for a tenant (optionally filtered by project_id).
  The org_id parameter is mapped to project_id for backwards compatibility
  with the frontend which still sends orgId.
  """

  params: Dict[str, Any] = {"tenant": tenant}

  if org_id:
    where_clause = "WHERE (project_id = :project_id OR tenant = :tenant)"
    params["project_id"] = org_id
  else:
    where_clause = "WHERE tenant = :tenant"

  result = await db.execute(
    text(
      f'''
      SELECT id,
             project_id,
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
      FROM "{tenant}".llm_evals_scorers
      {where_clause}
      ORDER BY created_at DESC
      '''
    ),
    params,
  )

  rows = result.mappings().all()
  scorers: List[Dict[str, Any]] = []
  for row in rows:
    scorers.append(
      {
        "id": row["id"],
        "orgId": row["project_id"],
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
  Maps org_id from frontend to project_id column in the database.
  """

  result = await db.execute(
    text(
      f'''
      INSERT INTO "{tenant}".llm_evals_scorers
      (id, project_id, name, description, type, metric_key, config, enabled,
       default_threshold, weight, tenant, created_by)
      VALUES
      (:id, :project_id, :name, :description, :type, :metric_key, :config, :enabled,
       :default_threshold, :weight, :tenant, :created_by)
      RETURNING id, project_id, name, description, type, metric_key, config, enabled,
                default_threshold, weight, created_at, updated_at, created_by
      '''
    ),
    {
      "id": scorer_id,
      "project_id": org_id,
      "name": name,
      "description": description,
      "type": scorer_type,
      "metric_key": metric_key,
      "config": json.dumps(config or {}),
      "enabled": enabled,
      "default_threshold": default_threshold,
      "weight": weight,
      "tenant": tenant,
      "created_by": created_by,
    },
  )

  row = result.mappings().first()
  if not row:
    return None

  return {
    "id": row["id"],
    "orgId": row["project_id"],
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
        SELECT id, project_id, name, description, type, metric_key, config, enabled,
               default_threshold, weight, created_at, updated_at, created_by
        FROM "{tenant}".llm_evals_scorers
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
        UPDATE "{tenant}".llm_evals_scorers
        SET {", ".join(updates)}
        WHERE id = :id
        RETURNING id, project_id, name, description, type, metric_key, config, enabled,
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
    "orgId": row["project_id"],
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
             project_id,
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
      FROM "{tenant}".llm_evals_scorers
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
    "orgId": row["project_id"],
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
      DELETE FROM "{tenant}".llm_evals_scorers
      WHERE id = :id
      RETURNING id
      '''
    ),
    {"id": scorer_id},
  )

  row = result.fetchone()
  return row is not None


async def get_latest_scorer(
  tenant: str,
  db: AsyncSession,
  org_id: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
  """
  Get the most recently added/updated scorer.
  Used for auto-populating experiment forms with the last used judge settings.
  """

  params: Dict[str, Any] = {"tenant": tenant}
  where_clauses = ["tenant = :tenant"]

  if org_id:
    where_clauses.append("project_id = :project_id")
    params["project_id"] = org_id

  where_clause = f"WHERE {' AND '.join(where_clauses)}"

  result = await db.execute(
    text(
      f'''
      SELECT id,
             project_id,
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
      FROM "{tenant}".llm_evals_scorers
      {where_clause}
      ORDER BY updated_at DESC NULLS LAST
      LIMIT 1
      '''
    ),
    params,
  )

  row = result.mappings().first()
  if not row:
    return None

  return {
    "id": row["id"],
    "orgId": row["project_id"],
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
