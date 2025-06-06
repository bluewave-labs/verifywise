from fastapi import APIRouter, Form, UploadFile
from controllers.bias_and_fairness import handle_upload as handle_upload_controller, get_metrics as get_metrics_controller, get_all_metrics as get_all_metrics_controller, delete_metrics as delete_metrics_controller

router = APIRouter()

@router.post("/upload")
async def upload_model(
    model: UploadFile = Form(...),
    data: UploadFile = Form(...),
    target_column: str = Form(...), 
    sensitive_column: str = Form(...), 
):
    return await handle_upload_controller(
        model=model,
        data=data,
        target_column=target_column,
        sensitive_column=sensitive_column
    )

@router.get("/metrics/all")
async def get_all_metrics():
    return await get_all_metrics_controller()

@router.get("/metrics/{id}")
async def get_metrics(id: int):
    return await get_metrics_controller(id)

@router.delete("/metrics/{id}")
async def delete_metrics(id: int):
    return await delete_metrics_controller(id)
