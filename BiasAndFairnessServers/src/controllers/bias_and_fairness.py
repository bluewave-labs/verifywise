import json
from fastapi.responses import JSONResponse
from crud.bias_and_fairness import upload_model, upload_data, insert_metrics, get_metrics_by_id, get_all_metrics_query
from utils.run_bias_and_fairness_check import analyze_fairness
from database.db import get_db
from fastapi import UploadFile

def get_all_metrics():
    """
    Retrieve all fairness metrics.
    """
    try:
        with get_db() as db:
            metrics = get_all_metrics_query(db)
            return metrics
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to retrieve metrics, {str(e)}"}
        )

def get_metrics(id: int):
    """
    Retrieve metrics for a given fairness run ID.
    """
    try:
        with get_db() as db:
            metrics = get_metrics_by_id(id, db)
            if not metrics:
                return JSONResponse(
                    status_code=404,
                    content={"error": "Metrics not found"}
                )
            return metrics
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to retrieve metrics, {str(e)}"}
        )

async def handle_upload(model: UploadFile, data: UploadFile, target_column: str, sensitive_column: str):
    """
    Handle file upload from the client.
    """
    try:
        with get_db() as db:
            # Start a transaction for the upload process
            transaction = db.begin()

            model_content = await model.read()
            model_filename = model.filename
            data_content = await data.read()
            data_filename = data.filename

            if not model_content or not data_content:
                raise ValueError("model or data file is empty")
            if not model_filename or not data_filename:
                raise ValueError("model or data file name is empty")

            upload_model_record = upload_model(content=model_content, name=model_filename, db=db)

            if not upload_model_record:
                raise Exception("failed to upload model file")

            upload_data_record = upload_data(
                content=data_content,
                name=data_filename,
                target_column=target_column,
                sensitive_column=sensitive_column,
                model_id=upload_model_record.id,
                db=db
            )

            if not upload_data_record:
                raise Exception("failed to upload data file")

            result = analyze_fairness(
                model_content=model_content, 
                data_content=data_content, 
                target_column=target_column, 
                sensitive_column=sensitive_column
            )
            
            metrics = insert_metrics(json.dumps(result), upload_data_record.id, db)
            if not metrics:
                raise Exception("failed to insert metrics")
            
            transaction.commit()

            return {
                "model_id": upload_model_record.id,
                "data_id": upload_data_record.id,
                "metrics_id": metrics.id,
                "metrics": metrics.metrics,
            }
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to handle upload, {str(e)}"}
        )
