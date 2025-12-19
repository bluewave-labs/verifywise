"""
CRUD operations for DeepEval scorers (metric definitions).
"""

from typing import List, Dict, Any, Optional
import json
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime


def _get_schema_name(tenant: str) -> str:
  """
  Resolve the underlying Postgres schema for a given tenant.
  Mirrors the logic used for deepeval_projects.
  """
  return "a4ayc80OGd" if tenant == "default" else tenant


async def list_scorers(
  tenant: str,
  db: AsyncSession,
  project_id: Optional[str] = None,
) -> List[Dict[str, Any]]:
  """
  List scorers for a tenant (optionally filtered by project_id).
  """
  schema_name = _get_schema_name(tenant)

  conditions = ['tenant = :tenant']
  params: Dict[str, Any] = {"tenant": tenant}

  if project_id:
    conditions.append("project_id = :project_id")
    params["project_id"] = project_id

  where_clause = " AND ".join(conditions)

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
             tenant,
             created_at,
             updated_at,
             created_by
      FROM "{schema_name}".deepeval_scorers
      WHERE {where_clause}
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
        "projectId": row["project_id"],
        "name": row["name"],
        "description": row["description"],
        "type": row["type"],
        "metricKey": row["metric_key"],
        "config": row["config"] or {},
        "enabled": row["enabled"],
        "defaultThreshold": float(row["default_threshold"]) if row["default_threshold"] is not None else None,
        "weight": float(row["weight"]) if row["weight"] is not None else None,
        "tenant": row["tenant"],
        "createdAt": row["created_at"].isoformat() if row["created_at"] else None,
        "updatedAt": row["updated_at"].isoformat() if row["updated_at"] else None,
        "createdBy": row["created_by"],
      }
    )
  return scorers


async def create_scorer(
  scorer_id: str,
  *,
  project_id: Optional[str],
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
  schema_name = _get_schema_name(tenant)

  result = await db.execute(
    text(
      f'''
      INSERT INTO "{schema_name}".deepeval_scorers
      (id, project_id, name, description, type, metric_key, config, enabled,
       default_threshold, weight, tenant, created_by)
      VALUES
      (:id, :project_id, :name, :description, :type, :metric_key, :config, :enabled,
       :default_threshold, :weight, :tenant, :created_by)
      RETURNING id, project_id, name, description, type, metric_key, config, enabled,
                default_threshold, weight, tenant, created_at, updated_at, created_by
      '''
    ),
    {
      "id": scorer_id,
      "project_id": project_id,
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
    "projectId": row["project_id"],
    "name": row["name"],
    "description": row["description"],
    "type": row["type"],
    "metricKey": row["metric_key"],
    "config": row["config"] or {},
    "enabled": row["enabled"],
    "defaultThreshold": float(row["default_threshold"]) if row["default_threshold"] is not None else None,
    "weight": float(row["weight"]) if row["weight"] is not None else None,
    "tenant": row["tenant"],
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
  schema_name = _get_schema_name(tenant)

  updates = []
  params: Dict[str, Any] = {"id": scorer_id, "tenant": tenant}

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
               default_threshold, weight, tenant, created_at, updated_at, created_by
        FROM "{schema_name}".deepeval_scorers
        WHERE id = :id AND tenant = :tenant
        '''
      ),
      params,
    )
  else:
    updates.append("updated_at = CURRENT_TIMESTAMP")
    result = await db.execute(
      text(
        f'''
        UPDATE "{schema_name}".deepeval_scorers
        SET {", ".join(updates)}
        WHERE id = :id AND tenant = :tenant
        RETURNING id, project_id, name, description, type, metric_key, config, enabled,
                  default_threshold, weight, tenant, created_at, updated_at, created_by
        '''
      ),
      params,
    )

  row = result.mappings().first()
  if not row:
    return None

  return {
    "id": row["id"],
    "projectId": row["project_id"],
    "name": row["name"],
    "description": row["description"],
    "type": row["type"],
    "metricKey": row["metric_key"],
    "config": row["config"] or {},
    "enabled": row["enabled"],
    "defaultThreshold": float(row["default_threshold"]) if row["default_threshold"] is not None else None,
    "weight": float(row["weight"]) if row["weight"] is not None else None,
    "tenant": row["tenant"],
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
  schema_name = _get_schema_name(tenant)

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
             tenant,
             created_at,
             updated_at,
             created_by
      FROM "{schema_name}".deepeval_scorers
      WHERE id = :id AND tenant = :tenant
      '''
    ),
    {"id": scorer_id, "tenant": tenant},
  )

  row = result.mappings().first()
  if not row:
    return None

  return {
    "id": row["id"],
    "projectId": row["project_id"],
    "name": row["name"],
    "description": row["description"],
    "type": row["type"],
    "metricKey": row["metric_key"],
    "config": row["config"] or {},
    "enabled": row["enabled"],
    "defaultThreshold": float(row["default_threshold"]) if row["default_threshold"] is not None else None,
    "weight": float(row["weight"]) if row["weight"] is not None else None,
    "tenant": row["tenant"],
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
  schema_name = _get_schema_name(tenant)

  result = await db.execute(
    text(
      f'''
      DELETE FROM "{schema_name}".deepeval_scorers
      WHERE id = :id AND tenant = :tenant
      RETURNING id
      '''
    ),
    {"id": scorer_id, "tenant": tenant},
  )

  row = result.fetchone()
  return row is not None


