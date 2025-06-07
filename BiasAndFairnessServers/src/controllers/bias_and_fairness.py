import json
from fastapi.responses import JSONResponse
from fastapi import HTTPException
from crud.bias_and_fairness import upload_model, upload_data, insert_metrics, get_metrics_by_id, get_all_metrics_query, delete_metrics_by_id
from utils.run_bias_and_fairness_check import analyze_fairness
from database.db import get_db
from fastapi import UploadFile

async def get_all_metrics():
    """
    Retrieve all fairness metrics.
    """
    try:
        async with get_db() as db:
            metrics = await get_all_metrics_query(db)
            return JSONResponse(
                status_code=200,
                content=[
                    {
                        "model_id": row.model_id,
                        "model_filename": row.model_filename,
                        "data_id": row.data_id,
                        "data_filename": row.data_filename,
                        "metrics_id": row.metrics_id
                    } for row in metrics
                ]
            )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve metrics, {str(e)}"
        )

async def get_metrics(id: int):
    """
    Retrieve metrics for a given fairness run ID.
    """
    try:
        async with get_db() as db:
            metrics = await get_metrics_by_id(id, db)
            if not metrics:
                raise HTTPException(
                    status_code=404,
                    detail=f"Metrics with ID {id} not found"
                )
            return JSONResponse(
                status_code=200,
                content={
                    "model_id": metrics.model_id,
                    "data_id": metrics.data_id,
                    "metrics_id": metrics.metrics_id,
                    "metrics": metrics.metrics
                }
            )
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve metrics, {str(e)}"
        )

async def handle_upload(model: UploadFile, data: UploadFile, target_column: str, sensitive_column: str):
    """
    Handle file upload from the client.
    """
    try:
        async with get_db() as db:
            transaction = await db.begin()

            model_content = await model.read()
            model_filename = model.filename
            data_content = await data.read()
            data_filename = data.filename

            if not model_content or not data_content:
                raise ValueError("model or data file is empty")
            if not model_filename or not data_filename:
                raise ValueError("model or data file name is empty")

            upload_model_record = await upload_model(content=model_content, name=model_filename, db=db)

            if not upload_model_record:
                raise Exception("failed to upload model file")

            upload_data_record = await upload_data(
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
            
            metrics = await insert_metrics(json.dumps(result), upload_data_record.id, db)
            if not metrics:
                raise Exception("failed to insert metrics")
            
            await transaction.commit()

            return JSONResponse(
                status_code=200,
                content={
                    "model_id": upload_model_record.id,
                    "data_id": upload_data_record.id,
                    "metrics_id": metrics.id,
                    "metrics": result
                }
            )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to handle upload, {str(e)}"
        )

async def delete_metrics(id: int):
    """
    Delete metrics for a given fairness run ID.
    """
    try:
        async with get_db() as db:
            delete = await delete_metrics_by_id(id, db)
            if not delete:
                raise HTTPException(
                    status_code=404,
                    detail=f"Metrics with ID {id} not found"
                )
            await db.commit()
            return JSONResponse(
                status_code=204,
                content=None
            )
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete metrics, {str(e)}"
        )
