from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

async def get_all_metrics_query(db: AsyncSession):
    """
    Retrieve all fairness metrics.
    """
    result = await db.execute(
        text("""
            SELECT 
                f.id AS model_id,
                f.name AS model_filename,
                d.id AS data_id,
                d.name AS data_filename,
                r.id AS metrics_id
            FROM model_files f JOIN model_data d ON f.id = d.model_id
                JOIN fairness_runs r ON r.data_id = d.id;""")
    )
    rows = result.mappings().all()
    return rows

async def get_metrics_by_id(id: int, db: AsyncSession):
    """
    Retrieve metrics for a given fairness run ID.
    """
    result = await db.execute(
        text("""
            SELECT 
                d.model_id AS model_id,
                d.id AS data_id,
                f.id AS metrics_id,
                f.metrics AS metrics
            FROM fairness_runs f JOIN model_data d ON f.data_id = d.id WHERE f.id = :id;"""),
        {"id": id}
    )
    row = result.mappings().first()
    return row

async def upload_model(content: bytes, name: str, db: AsyncSession):
    result = await db.execute(
        text("INSERT INTO model_files (name, file_content) VALUES (:name, :file_content) RETURNING id"),
        {"name": name, "file_content": content}
    )
    row = result.fetchone()
    return row

async def upload_data(content: bytes, name: str, target_column: str, sensitive_column: str, model_id: int, db: AsyncSession):
    result = await db.execute(
        text("INSERT INTO model_data (name, file_content, target_column, sensitive_column, model_id) VALUES (:name, :file_content, :target_column, :sensitive_column, :model_id) RETURNING id"),
        {"name": name, "file_content": content, "target_column": target_column, "sensitive_column": sensitive_column, "model_id": model_id}
    )
    row = result.fetchone()
    return row

async def insert_metrics(metrics: str, data_id: int, db: AsyncSession):
    result = await db.execute(
        text("INSERT INTO fairness_runs (data_id, metrics) VALUES (:data_id, :metrics) RETURNING *"),
        {"data_id": data_id, "metrics": metrics}
    )
    row = result.fetchone()
    return row

async def delete_metrics_by_id(id: int, db: AsyncSession):
    """
    Delete metrics by ID.
    """
    result_metrics = await db.execute(
        text("DELETE FROM fairness_runs WHERE id = :id RETURNING *"),
        {"id": id}
    )
    row_metrics = result_metrics.fetchone()
    if not row_metrics:
        return False

    # Delete associated model data and files
    result_data = await db.execute(
        text("DELETE FROM model_data WHERE id = :data_id RETURNING model_id"),
        {"data_id": row_metrics.data_id}
    )
    row_data = result_data.fetchone()
    if row_data:
        await db.execute(
            text("DELETE FROM model_files WHERE id = :model_id"),
            {"model_id": row_data.model_id}
        )
        return True
    return False
