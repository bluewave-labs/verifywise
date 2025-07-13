from fastapi import APIRouter, Form, UploadFile, BackgroundTasks, Request, HTTPException
from controllers.bias_and_fairness import handle_upload as handle_upload_controller, get_metrics as get_metrics_controller, get_all_metrics as get_all_metrics_controller, delete_metrics as delete_metrics_controller, get_upload_status as get_upload_status_controller

router = APIRouter()

@router.post("/upload")
async def upload_model(
    request: Request,
    background_tasks: BackgroundTasks,
    model: UploadFile = Form(...),
    data: UploadFile = Form(...),
    target_column: str = Form(...),
    sensitive_column: str = Form(...)
):
    return await handle_upload_controller(
        background_tasks=background_tasks,
        model=model,
        data=data,
        target_column=target_column,
        sensitive_column=sensitive_column,
        tenant=request.headers["x-tenant-id"]
    )

@router.get("/upload/status/{job_id}")
async def get_upload_status(job_id: int, request: Request):
    return await get_upload_status_controller(job_id, request.headers["x-tenant-id"])

@router.get("/metrics/all")
async def get_all_metrics(request: Request):
    return await get_all_metrics_controller(request.headers["x-tenant-id"])

@router.get("/metrics/{id}")
async def get_metrics(id: int, request: Request):
    return await get_metrics_controller(id, request.headers["x-tenant-id"])

@router.delete("/metrics/{id}")
async def delete_metrics(id: int, request: Request):
    return await delete_metrics_controller(id, request.headers["x-tenant-id"])
