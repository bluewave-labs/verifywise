from sqlalchemy import text
from sqlalchemy.orm import Session

async def get_metrics_by_id(id: int, db: Session):
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

async def upload_model(content: bytes, name: str, db: Session):
    result = db.execute(
        text("INSERT INTO model_files (name, file_content) VALUES (:name, :file_content) RETURNING id"),
        {"name": name, "file_content": content}
    )
    row = result.fetchone()
    return row

async def upload_data(content: bytes, name: str, target_column: str, sensitive_column: str, model_id: int, db: Session):
    result = db.execute(
        text("INSERT INTO model_data (name, file_content, target_column, sensitive_column, model_id) VALUES (:name, :file_content, :target_column, :sensitive_column, :model_id) RETURNING id"),
        {"name": name, "file_content": content, "target_column": target_column, "sensitive_column": sensitive_column, "model_id": model_id}
    )
    row = result.fetchone()
    return row

async def insert_metrics(metrics: str, data_id: int, db: Session):
    result = db.execute(
        text("INSERT INTO fairness_runs (data_id, metrics) VALUES (:data_id, :metrics) RETURNING *"),
        {"data_id": data_id, "metrics": metrics}
    )
    row = result.fetchone()
    return row
