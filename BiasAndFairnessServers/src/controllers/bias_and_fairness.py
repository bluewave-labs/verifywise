import json
from fastapi.responses import JSONResponse
from crud.bias_and_fairness import upload_model, upload_data, insert_metrics, get_metrics_by_id
from utils.run_bias_and_fairness_check import analyze_fairness
from database.db import get_db

async def get_metrics(id):
    """
    Retrieve metrics for a given fairness run ID.
    """
    id = int(id)
    with get_db() as db:
        metrics = await get_metrics_by_id(id, db)
        if metrics:
            return metrics
    return JSONResponse(
        status_code=404,
        content={"error": "Metrics not found"}
    )

async def handle_upload(model, data, target_column, sensitive_column):
    """
    Handle file upload from the client.
    """
    with get_db() as db:
        # Start a transaction for the upload process
        transaction = db.begin()

        model_content = await model.read()
        model_filename = model.filename
        data_content = await data.read()
        data_filename = data.filename

        upload_model_record = await upload_model(model_content, model_filename, db)
        upload_data_record = await upload_data(data_content, data_filename, target_column, sensitive_column, upload_model_record.id, db)

        result = analyze_fairness(
            model_content, 
            data_content, 
            target_column, 
            sensitive_column
        )
        metrics = await insert_metrics(json.dumps(result), upload_data_record.id, db)
        
        transaction.commit()

        return {
            "model_id": upload_model_record.id,
            "data_id": upload_data_record.id,
            "metrics_id": metrics.id,
            "metrics": metrics.metrics,
        }

    return JSONResponse(
        status_code=500,
        content={"error": "Failed to handle upload"}
    )
