from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

async def get_all_metrics_query(db: AsyncSession, tenant: str):
    """
    Retrieve all fairness metrics.
    """
    result = await db.execute(
        text(f"""
            SELECT 
                f.id AS model_id,
                f.name AS model_filename,
                d.id AS data_id,
                d.name AS data_filename,
                r.id AS metrics_id
            FROM "{tenant}".model_files f JOIN "{tenant}".model_data d ON f.id = d.model_id
                JOIN "{tenant}".fairness_runs r ON r.data_id = d.id;""")
    )
    rows = result.mappings().all()
    return rows

async def get_metrics_by_id(id: int, db: AsyncSession, tenant: str):
    """
    Retrieve metrics for a given fairness run ID.
    """
    result = await db.execute(
        text(f"""
            SELECT 
                d.model_id AS model_id,
                d.id AS data_id,
                f.id AS metrics_id,
                f.metrics AS metrics
            FROM "{tenant}".fairness_runs f JOIN "{tenant}".model_data d ON f.data_id = d.id WHERE f.id = :id;"""),
        {"id": id}
    )
    row = result.mappings().first()
    return row

async def upload_model(content: bytes, name: str, db: AsyncSession, tenant: str):
    result = await db.execute(
        text(f'INSERT INTO "{tenant}".model_files (name, file_content) VALUES (:name, :file_content) RETURNING id'),
        {"name": name, "file_content": content}
    )
    row = result.fetchone()
    return row

async def upload_data(content: bytes, name: str, target_column: str, sensitive_column: str, model_id: int, db: AsyncSession, tenant: str):
    result = await db.execute(
        text(f'INSERT INTO "{tenant}".model_data (name, file_content, target_column, sensitive_column, model_id) VALUES (:name, :file_content, :target_column, :sensitive_column, :model_id) RETURNING id'),
        {"name": name, "file_content": content, "target_column": target_column, "sensitive_column": sensitive_column, "model_id": model_id}
    )
    row = result.fetchone()
    return row

async def insert_metrics(metrics: str, data_id: int, db: AsyncSession, tenant: str):
    result = await db.execute(
        text(f'INSERT INTO "{tenant}".fairness_runs (data_id, metrics) VALUES (:data_id, :metrics) RETURNING *'),
        {"data_id": data_id, "metrics": metrics}
    )
    row = result.fetchone()
    return row

async def delete_metrics_by_id(id: int, db: AsyncSession, tenant: str):
    """
    Delete metrics by ID.
    """
    result_metrics = await db.execute(
        text(f'DELETE FROM "{tenant}".fairness_runs WHERE id = :id RETURNING *'),
        {"id": id}
    )
    row_metrics = result_metrics.fetchone()
    if not row_metrics:
        return False

    # Delete associated model data and files
    result_data = await db.execute(
        text(f'DELETE FROM "{tenant}".model_data WHERE id = :data_id RETURNING model_id'),
        {"data_id": row_metrics.data_id}
    )
    row_data = result_data.fetchone()
    if row_data:
        await db.execute(
            text(f'DELETE FROM "{tenant}".model_files WHERE id = :model_id'),
            {"model_id": row_data.model_id}
        )
        return True
    return False

async def insert_bias_fairness_evaluation(
    eval_id: str,
    model_name: str,
    dataset_name: str,
    model_task: str,
    label_behavior: str,
    config_data: str,
    tenant: str,
    db: AsyncSession
):
    """Insert a new bias and fairness evaluation."""
    # Use the correct schema name
    schema_name = "a4ayc80OGd" if tenant == "default" else tenant
    result = await db.execute(
        text(f'''
            INSERT INTO "{schema_name}".bias_fairness_evaluations 
            (eval_id, model_name, dataset_name, model_task, label_behavior, config_data) 
            VALUES (:eval_id, :model_name, :dataset_name, :model_task, :label_behavior, :config_data) 
            RETURNING id
        '''),
        {
            "eval_id": eval_id,
            "model_name": model_name,
            "dataset_name": dataset_name,
            "model_task": model_task,
            "label_behavior": label_behavior,
            "config_data": config_data
        }
    )
    row = result.fetchone()
    return row

async def get_all_bias_fairness_evaluations(db: AsyncSession, tenant: str):
    """Get all bias and fairness evaluations for a tenant."""
    # Use the correct schema name
    schema_name = "a4ayc80OGd" if tenant == "default" else tenant
    result = await db.execute(
        text(f'''
            SELECT 
                id,
                eval_id,
                model_name,
                dataset_name,
                model_task,
                label_behavior,
                config_data,
                status,
                results,
                created_at,
                updated_at
            FROM "{schema_name}".bias_fairness_evaluations 
            ORDER BY created_at DESC
        '''),
    )
    rows = result.mappings().all()
    return rows

async def get_bias_fairness_evaluation_by_id(eval_id: str, db: AsyncSession, tenant: str):
    """Get a specific bias and fairness evaluation by eval_id."""
    # Use the correct schema name
    schema_name = "a4ayc80OGd" if tenant == "default" else tenant
    result = await db.execute(
        text(f'''
            SELECT 
                id,
                eval_id,
                model_name,
                dataset_name,
                model_task,
                label_behavior,
                config_data,
                status,
                results,
                created_at,
                updated_at
            FROM "{schema_name}".bias_fairness_evaluations 
            WHERE eval_id = :eval_id
        '''),
        {"eval_id": eval_id}
    )
    row = result.mappings().first()
    return row

async def update_bias_fairness_evaluation_status(
    eval_id: str, 
    status: str, 
    results: dict = None, 
    db: AsyncSession = None, 
    tenant: str = None
):
    """Update the status and results of a bias and fairness evaluation."""
    # Use the correct schema name
    schema_name = "a4ayc80OGd" if tenant == "default" else tenant
    
    if results is not None:
        # Ensure results is JSON-serializable for JSONB column
        from json import dumps
        serializable_results = dumps(results) if not isinstance(results, (str, bytes)) else results
        result = await db.execute(
            text(f'''
                UPDATE "{schema_name}".bias_fairness_evaluations 
                SET status = :status, results = :results, updated_at = CURRENT_TIMESTAMP
                WHERE eval_id = :eval_id
                RETURNING id
            '''),
            {"eval_id": eval_id, "status": status, "results": serializable_results}
        )
    else:
        result = await db.execute(
            text(f'''
                UPDATE "{schema_name}".bias_fairness_evaluations 
                SET status = :status, updated_at = CURRENT_TIMESTAMP
                WHERE eval_id = :eval_id
                RETURNING id
            '''),
            {"eval_id": eval_id, "status": status}
        )
    row = result.fetchone()
    return row

async def delete_bias_fairness_evaluation(eval_id: str, db: AsyncSession, tenant: str):
    """Delete a bias and fairness evaluation."""
    # Use the correct schema name
    schema_name = "a4ayc80OGd" if tenant == "default" else tenant
    result = await db.execute(
        text(f'''
            DELETE FROM "{schema_name}".bias_fairness_evaluations 
            WHERE eval_id = :eval_id
            RETURNING id
        '''),
        {"eval_id": eval_id}
    )
    row = result.fetchone()
    return row
