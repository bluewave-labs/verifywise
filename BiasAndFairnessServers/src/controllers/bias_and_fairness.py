import io
import asyncio
import json
from fastapi.responses import JSONResponse, Response
from fastapi import HTTPException
from crud.bias_and_fairness import upload_model, upload_data, insert_metrics, get_metrics_by_id, get_all_metrics_query, delete_metrics_by_id
from utils.run_bias_and_fairness_check import analyze_fairness
from utils.handle_files_uploads import process_files
from database.db import get_db
from fastapi import UploadFile, BackgroundTasks
from database.redis import get_next_job_id, get_job_status, delete_job_status

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

async def get_upload_status(job_id: int):
    value = await get_job_status(job_id)
    if value is None:
        return Response(status_code=204)
    await delete_job_status(job_id)
    return JSONResponse(
        status_code=200,
        content=value,
        media_type="application/json"
    )

async def handle_upload(background_tasks: BackgroundTasks, model: UploadFile, data: UploadFile, target_column: str, sensitive_column: str):
    """
    Handle file upload from the client.
    """
    job_id = await get_next_job_id()
    response = JSONResponse(status_code=202, content={
        "message": "Processing started", 
        "job_id": job_id,
        "model_filename": model.filename.replace(".gz", "") if model.filename else "",
        "data_filename": data.filename.replace(".gz", "") if data.filename else ""
    }, media_type="application/json")
    model_ = {
        "filename": model.filename,
        "content": await model.read()
    }
    data_ = {
        "filename": data.filename,
        "content": await data.read()
    }
    # create a job ID or use a unique identifier for the task
    background_tasks.add_task(process_files, job_id, model_, data_, target_column, sensitive_column)
    return response

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
            return Response(status_code=204)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete metrics, {str(e)}"
        )
