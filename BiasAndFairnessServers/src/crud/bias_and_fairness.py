from database.db import get_db
from sqlalchemy import text

async def get_metrics_by_id(id, db):
    """
    Retrieve metrics for a given fairness run ID.
    """
    result = db.execute(
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

async def upload_model(content, name, db):
    result = db.execute(
        text("INSERT INTO model_files (name, file_content) VALUES (:name, :file_content) RETURNING id"),
        {"name": name, "file_content": content}
    )
    row = result.fetchone()
    return row

async def upload_data(content, name, target_column, sensitive_column, model_id, db):
    result = db.execute(
        text("INSERT INTO model_data (name, file_content, target_column, sensitive_column, model_id) VALUES (:name, :file_content, :target_column, :sensitive_column, :model_id) RETURNING id"),
        {"name": name, "file_content": content, "target_column": target_column, "sensitive_column": sensitive_column, "model_id": model_id}
    )
    row = result.fetchone()
    return row

async def insert_metrics(metrics, data_id, db):
    result = db.execute(
        text("INSERT INTO fairness_runs (data_id, metrics) VALUES (:data_id, :metrics) RETURNING *"),
        {"data_id": data_id, "metrics": metrics}
    )
    row = result.fetchone()
    return row
