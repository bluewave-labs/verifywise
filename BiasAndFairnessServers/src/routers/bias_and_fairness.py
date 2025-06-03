from fastapi import APIRouter, Form, UploadFile
from controllers.bias_and_fairness import handle_upload as handle_upload_controller, get_metrics as get_metrics_controller

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

@router.get("/metrics/{id}")
def get_metrics(id: int):
    return get_metrics_controller(id)
