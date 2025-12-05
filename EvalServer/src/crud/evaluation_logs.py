"""CRUD operations for evaluation logs, metrics, and experiments"""

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid
import json


# ==================== LOGS ====================

async def create_log(
    db: AsyncSession,
    project_id: str,
    tenant: str,
    experiment_id: Optional[str] = None,
    trace_id: Optional[str] = None,
    parent_trace_id: Optional[str] = None,
    span_name: Optional[str] = None,
    input_text: Optional[str] = None,
    output_text: Optional[str] = None,
    model_name: Optional[str] = None,
    metadata: Optional[Dict] = None,
    latency_ms: Optional[int] = None,
    token_count: Optional[int] = None,
    cost: Optional[float] = None,
    status: Optional[str] = "success",
    error_message: Optional[str] = None,
    created_by: Optional[int] = None,
) -> Optional[Dict[str, Any]]:
    """Create a new evaluation log entry"""
    schema_name = "a4ayc80OGd" if tenant == "default" else tenant
    log_id = str(uuid.uuid4())
    trace = trace_id or str(uuid.uuid4())
    
    metadata_json = json.dumps(metadata) if metadata else '{}'
    
    result = await db.execute(
        text(f'''
            INSERT INTO "{schema_name}".evaluation_logs 
            (id, project_id, experiment_id, trace_id, parent_trace_id, span_name,
             input_text, output_text, model_name, metadata, latency_ms, token_count,
             cost, status, error_message, tenant, created_by)
            VALUES (:id, :project_id, :experiment_id, CAST(:trace_id AS uuid), CAST(:parent_trace_id AS uuid), :span_name,
                    :input_text, :output_text, :model_name, CAST(:metadata_json AS jsonb), :latency_ms, :token_count,
                    :cost, :status, :error_message, :tenant, :created_by)
            RETURNING id, project_id, experiment_id, trace_id, timestamp, status
        '''),
        {
            "id": log_id,
            "project_id": project_id,
            "experiment_id": experiment_id,
            "trace_id": trace,
            "parent_trace_id": parent_trace_id,
            "span_name": span_name,
            "input_text": input_text,
            "output_text": output_text,
            "model_name": model_name,
            "metadata_json": metadata_json,
            "latency_ms": latency_ms,
            "token_count": token_count,
            "cost": cost,
            "status": status,
            "error_message": error_message,
            "tenant": tenant,
            "created_by": created_by,
        }
    )
    
    await db.commit()
    row = result.mappings().first()
    
    if row:
        return {
            "id": str(row["id"]),
            "project_id": row["project_id"],
            "experiment_id": row["experiment_id"],
            "trace_id": str(row["trace_id"]) if row["trace_id"] else None,
            "timestamp": row["timestamp"].isoformat() if row["timestamp"] else None,
            "status": row["status"],
        }
    return None


async def update_log_metadata(
    db: AsyncSession,
    log_id: str,
    tenant: str,
    metadata: Dict[str, Any],
) -> bool:
    """Merge/replace metadata for a specific log id"""
    schema_name = "a4ayc80OGd" if tenant == "default" else tenant
    metadata_json = json.dumps(metadata) if metadata else '{}'
    result = await db.execute(
        text(f'''
            UPDATE "{schema_name}".evaluation_logs
            SET metadata = COALESCE(metadata, '{{}}'::jsonb) || CAST(:metadata_json AS jsonb)
            WHERE id = :log_id AND tenant = :tenant
            RETURNING id
        '''),
        {"metadata_json": metadata_json, "log_id": log_id, "tenant": tenant}
    )
    await db.commit()
    return result.mappings().first() is not None


async def get_logs(
    db: AsyncSession,
    tenant: str,
    project_id: Optional[str] = None,
    experiment_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
) -> List[Dict[str, Any]]:
    """Get logs with optional filtering"""
    schema_name = "a4ayc80OGd" if tenant == "default" else tenant
    
    where_clauses = ["tenant = :tenant"]
    params = {"tenant": tenant, "limit": limit, "offset": offset}
    
    if project_id:
        where_clauses.append("project_id = :project_id")
        params["project_id"] = project_id
    if experiment_id:
        where_clauses.append("experiment_id = :experiment_id")
        params["experiment_id"] = experiment_id
    if status:
        where_clauses.append("status = :status")
        params["status"] = status
    
    where_clause = " AND ".join(where_clauses)
    
    result = await db.execute(
        text(f'''
            SELECT id, project_id, experiment_id, trace_id, span_name,
                   input_text, output_text, model_name, metadata, latency_ms, token_count,
                   cost, status, error_message, timestamp
            FROM "{schema_name}".evaluation_logs
            WHERE {where_clause}
            ORDER BY timestamp DESC
            LIMIT :limit OFFSET :offset
        '''),
        params
    )
    
    logs = []
    for row in result.mappings():
        logs.append({
            "id": str(row["id"]),
            "project_id": row["project_id"],
            "experiment_id": row["experiment_id"],
            "trace_id": str(row["trace_id"]) if row["trace_id"] else None,
            "span_name": row["span_name"],
            "input_text": row["input_text"],
            "output_text": row["output_text"],
            "model_name": row["model_name"],
            "metadata": row["metadata"] if row["metadata"] else {},
            "latency_ms": row["latency_ms"],
            "token_count": row["token_count"],
            "cost": float(row["cost"]) if row["cost"] else None,
            "status": row["status"],
            "error_message": row["error_message"],
            "timestamp": row["timestamp"].isoformat() if row["timestamp"] else None,
        })
    
    return logs


async def get_log_count(
    db: AsyncSession,
    tenant: str,
    project_id: Optional[str] = None,
    status: Optional[str] = None,
) -> int:
    """Get total count of logs"""
    schema_name = "a4ayc80OGd" if tenant == "default" else tenant
    
    where_clauses = ["tenant = :tenant"]
    params = {"tenant": tenant}
    
    if project_id:
        where_clauses.append("project_id = :project_id")
        params["project_id"] = project_id
    if status:
        where_clauses.append("status = :status")
        params["status"] = status
    
    where_clause = " AND ".join(where_clauses)
    
    result = await db.execute(
        text(f'SELECT COUNT(*) as count FROM "{schema_name}".evaluation_logs WHERE {where_clause}'),
        params
    )
    
    row = result.mappings().first()
    return row["count"] if row else 0


# ==================== METRICS ====================

async def create_metric(
    db: AsyncSession,
    project_id: str,
    metric_name: str,
    metric_type: str,
    value: float,
    tenant: str,
    experiment_id: Optional[str] = None,
    dimensions: Optional[Dict] = None,
) -> Optional[Dict[str, Any]]:
    """Create a new metric entry"""
    schema_name = "a4ayc80OGd" if tenant == "default" else tenant
    metric_id = str(uuid.uuid4())
    dimensions_json = json.dumps(dimensions) if dimensions else '{}'
    
    result = await db.execute(
        text(f'''
            INSERT INTO "{schema_name}".evaluation_metrics 
            (id, project_id, experiment_id, metric_name, metric_type, value, dimensions, tenant)
            VALUES (:id, :project_id, :experiment_id, :metric_name, :metric_type, :value, CAST(:dimensions_json AS jsonb), :tenant)
            RETURNING id, project_id, metric_name, value, timestamp
        '''),
        {
            "id": metric_id,
            "project_id": project_id,
            "experiment_id": experiment_id,
            "metric_name": metric_name,
            "metric_type": metric_type,
            "value": value,
            "dimensions_json": dimensions_json,
            "tenant": tenant,
        }
    )
    
    await db.commit()
    row = result.mappings().first()
    
    if row:
        return {
            "id": str(row["id"]),
            "project_id": row["project_id"],
            "metric_name": row["metric_name"],
            "value": row["value"],
            "timestamp": row["timestamp"].isoformat() if row["timestamp"] else None,
        }
    return None


async def get_metric_aggregates(
    db: AsyncSession,
    tenant: str,
    project_id: str,
    metric_name: str,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
) -> Dict[str, float]:
    """Get aggregated statistics for a metric"""
    schema_name = "a4ayc80OGd" if tenant == "default" else tenant
    
    where_clauses = ["tenant = :tenant", "project_id = :project_id", "metric_name = :metric_name"]
    params = {
        "tenant": tenant,
        "project_id": project_id,
        "metric_name": metric_name,
    }
    
    if start_date:
        where_clauses.append("timestamp >= :start_date")
        params["start_date"] = start_date
    if end_date:
        where_clauses.append("timestamp <= :end_date")
        params["end_date"] = end_date
    
    where_clause = " AND ".join(where_clauses)
    
    result = await db.execute(
        text(f'''
            SELECT 
                AVG(value) as avg,
                MIN(value) as min,
                MAX(value) as max,
                COUNT(*) as count
            FROM "{schema_name}".evaluation_metrics
            WHERE {where_clause}
        '''),
        params
    )
    
    row = result.mappings().first()
    
    if row:
        return {
            "average": float(row["avg"]) if row["avg"] else 0,
            "min": float(row["min"]) if row["min"] else 0,
            "max": float(row["max"]) if row["max"] else 0,
            "count": row["count"] or 0,
        }
    
    return {"average": 0, "min": 0, "max": 0, "count": 0}


# ==================== EXPERIMENTS ====================

async def create_experiment(
    db: AsyncSession,
    project_id: str,
    name: str,
    config: Dict,
    tenant: str,
    description: Optional[str] = None,
    baseline_experiment_id: Optional[str] = None,
    created_by: Optional[int] = None,
) -> Optional[Dict[str, Any]]:
    """Create a new experiment"""
    schema_name = "a4ayc80OGd" if tenant == "default" else tenant
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
    experiment_id = f"exp_{timestamp}"
    
    print(f"💾 CRUD - Inserting experiment into database...")
    print(f"   Schema: {schema_name}")
    print(f"   Experiment ID: {experiment_id}")
    print(f"   Project ID: {project_id}")
    
    try:
        config_json = json.dumps(config) if config else '{}'
        
        result = await db.execute(
            text(f'''
                INSERT INTO "{schema_name}".experiments 
                (id, project_id, name, description, config, baseline_experiment_id, status, tenant, created_by)
                VALUES (:id, :project_id, :name, :description, CAST(:config_json AS jsonb), :baseline_experiment_id, :status, :tenant, :created_by)
                RETURNING id, name, status, created_at
            '''),
            {
                "id": experiment_id,
                "project_id": project_id,
                "name": name,
                "description": description,
                "config_json": config_json,
                "baseline_experiment_id": baseline_experiment_id,
                "status": "pending",
                "tenant": tenant,
                "created_by": created_by,
            }
        )
        
        await db.commit()
        row = result.mappings().first()
        
        if row:
            print(f"✅ CRUD - Experiment inserted successfully")
            return {
                "id": row["id"],
                "name": row["name"],
                "status": row["status"],
                "created_at": row["created_at"].isoformat() if row["created_at"] else None,
            }
        return None
    except Exception as e:
        print(f"❌ CRUD ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        raise


async def get_experiment_by_id(
    db: AsyncSession,
    experiment_id: str,
    tenant: str,
) -> Optional[Dict[str, Any]]:
    """Get a specific experiment by ID"""
    schema_name = "a4ayc80OGd" if tenant == "default" else tenant
    
    result = await db.execute(
        text(f'''
            SELECT id, project_id, name, description, config, baseline_experiment_id,
                   status, results, error_message, started_at, completed_at, 
                   created_at, updated_at, tenant, created_by
            FROM "{schema_name}".experiments
            WHERE id = :experiment_id AND tenant = :tenant
        '''),
        {"experiment_id": experiment_id, "tenant": tenant}
    )
    
    row = result.mappings().first()
    
    if row:
        return {
            "id": row["id"],
            "project_id": row["project_id"],
            "name": row["name"],
            "description": row["description"],
            "config": row["config"],
            "baseline_experiment_id": row["baseline_experiment_id"],
            "status": row["status"],
            "results": row["results"],
            "error_message": row["error_message"],
            "started_at": row["started_at"].isoformat() if row["started_at"] else None,
            "completed_at": row["completed_at"].isoformat() if row["completed_at"] else None,
            "created_at": row["created_at"].isoformat() if row["created_at"] else None,
            "updated_at": row["updated_at"].isoformat() if row["updated_at"] else None,
            "tenant": row["tenant"],
            "created_by": row["created_by"],
        }
    return None


async def get_experiments(
    db: AsyncSession,
    tenant: str,
    project_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
) -> List[Dict[str, Any]]:
    """Get experiments with optional filtering"""
    schema_name = "a4ayc80OGd" if tenant == "default" else tenant

    where_clauses = []
    params = {"limit": limit, "offset": offset}
    
    if project_id:
        where_clauses.append("project_id = :project_id")
        params["project_id"] = project_id
    if status:
        where_clauses.append("status = :status")
        params["status"] = status

    where_clause = (" WHERE " + " AND ".join(where_clauses)) if where_clauses else ""

    result = await db.execute(
        text(f'''
            SELECT id, project_id, name, description, config, status,
                   results, created_at, updated_at, started_at, completed_at
            FROM "{schema_name}".experiments
            {where_clause}
            ORDER BY created_at DESC
            LIMIT :limit OFFSET :offset
        '''),
        params
    )
    
    experiments = []
    for row in result.mappings():
        experiments.append({
            "id": row["id"],
            "project_id": row["project_id"],
            "name": row["name"],
            "description": row["description"],
            "config": row["config"],
            "status": row["status"],
            "results": row["results"],
            "created_at": row["created_at"].isoformat() if row["created_at"] else None,
            "updated_at": row["updated_at"].isoformat() if row["updated_at"] else None,
            "started_at": row["started_at"].isoformat() if row["started_at"] else None,
            "completed_at": row["completed_at"].isoformat() if row["completed_at"] else None,
        })
    
    return experiments


async def get_experiment_count(
    db: AsyncSession,
    tenant: str,
    project_id: Optional[str] = None
) -> int:
    """Get total count of experiments"""
    schema_name = "a4ayc80OGd" if tenant == "default" else tenant

    where_clauses = []
    params = {}

    if project_id:
        where_clauses.append("project_id = :project_id")
        params["project_id"] = project_id

    where_clause = (" WHERE " + " AND ".join(where_clauses)) if where_clauses else ""

    result = await db.execute(
        text(f'SELECT COUNT(*) as count FROM "{schema_name}".experiments {where_clause}'),
        params
    )

    row = result.mappings().first()
    return row["count"] if row else 0


async def update_experiment_status(
    db: AsyncSession,
    experiment_id: str,
    tenant: str,
    status: str,
    results: Optional[Dict] = None,
    error_message: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    """Update experiment status and results"""
    schema_name = "a4ayc80OGd" if tenant == "default" else tenant
    
    # Build update fields
    updates = ["status = :status", "updated_at = CURRENT_TIMESTAMP"]
    params = {"experiment_id": experiment_id, "tenant": tenant, "status": status}
    
    if results is not None:
        updates.append("results = CAST(:results_json AS jsonb)")
        params["results_json"] = json.dumps(results)
    
    if error_message is not None:
        updates.append("error_message = :error_message")
        params["error_message"] = error_message
    
    if status == "running":
        updates.append("started_at = COALESCE(started_at, CURRENT_TIMESTAMP)")
    elif status in ["completed", "failed"]:
        updates.append("completed_at = CURRENT_TIMESTAMP")
    
    update_clause = ", ".join(updates)
    
    result = await db.execute(
        text(f'''
            UPDATE "{schema_name}".experiments
            SET {update_clause}
            WHERE id = :experiment_id AND tenant = :tenant
            RETURNING id, status, updated_at
        '''),
        params
    )
    
    await db.commit()
    row = result.mappings().first()
    
    if row:
        return {
            "id": row["id"],
            "status": row["status"],
            "updated_at": row["updated_at"].isoformat() if row["updated_at"] else None,
        }
    return None


async def update_experiment(
    db: AsyncSession,
    experiment_id: str,
    tenant: str,
    name: Optional[str] = None,
    description: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    """Update experiment name and/or description"""
    schema_name = "a4ayc80OGd" if tenant == "default" else tenant

    # Build update fields dynamically
    updates = ["updated_at = CURRENT_TIMESTAMP"]
    params = {"experiment_id": experiment_id, "tenant": tenant}

    if name is not None:
        updates.append("name = :name")
        params["name"] = name

    if description is not None:
        updates.append("description = :description")
        params["description"] = description

    if len(updates) == 1:  # Only updated_at
        return None

    update_clause = ", ".join(updates)

    result = await db.execute(
        text(f'''
            UPDATE "{schema_name}".experiments
            SET {update_clause}
            WHERE id = :experiment_id AND tenant = :tenant
            RETURNING *
        '''),
        params
    )

    await db.commit()
    row = result.mappings().first()

    if row:
        return dict(row)
    return None


async def delete_experiment(
    db: AsyncSession,
    experiment_id: str,
    tenant: str,
) -> bool:
    """
    Delete an experiment and all associated logs and metrics
    
    Args:
        db: Database session
        experiment_id: Experiment ID to delete
        tenant: Tenant ID
        
    Returns:
        True if deleted successfully, False if not found
    """
    schema_name = tenant
    
    try:
        # First, delete associated evaluation logs
        await db.execute(
            text(f'''
                DELETE FROM "{schema_name}".evaluation_logs
                WHERE experiment_id = :experiment_id AND tenant = :tenant
            '''),
            {"experiment_id": experiment_id, "tenant": tenant}
        )
        
        # Then delete the experiment
        result = await db.execute(
            text(f'''
                DELETE FROM "{schema_name}".experiments
                WHERE id = :experiment_id AND tenant = :tenant
                RETURNING id
            '''),
            {"experiment_id": experiment_id, "tenant": tenant}
        )
        
        await db.commit()
        row = result.mappings().first()
        
        return row is not None
    except Exception as e:
        print(f"❌ Error deleting experiment: {e}")
        await db.rollback()
        raise
