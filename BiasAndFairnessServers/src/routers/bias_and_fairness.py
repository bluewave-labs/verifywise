from fastapi import APIRouter, Form, UploadFile, BackgroundTasks, Request, HTTPException, Body
from controllers.bias_and_fairness import (
    handle_upload as handle_upload_controller, 
    get_metrics as get_metrics_controller, 
    get_all_metrics as get_all_metrics_controller, 
    delete_metrics as delete_metrics_controller, 
    get_upload_status as get_upload_status_controller,
    handle_evaluation as handle_evaluation_controller,
    get_evaluation_status as get_evaluation_status_controller,
    get_evaluation_results as get_evaluation_results_controller,
    get_all_evaluations as get_all_evaluations_controller,
    cancel_evaluation as cancel_evaluation_controller,
    create_config_and_run_evaluation as create_config_and_run_evaluation_controller,
    get_all_bias_fairness_evaluations_controller,
    get_bias_fairness_evaluation_by_id_controller,
    delete_bias_fairness_evaluation_controller
)

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

@router.post("/evaluate/config")
async def create_config_and_evaluate(
    request: Request,
    background_tasks: BackgroundTasks,
    config_data: dict = Body(...)
):
    """
    Create config.yaml file and run bias and fairness evaluation.
    """
    print(f"Creating config and running evaluation for tenant: {request.headers['x-tenant-id']}")
    return await create_config_and_run_evaluation_controller(
        background_tasks=background_tasks,
        config_data=config_data,
        tenant=request.headers["x-tenant-id"]
    )
# New endpoints for Bias and Fairness Module
@router.post("/evaluate")
async def evaluate_model(
    request: Request,
    background_tasks: BackgroundTasks,
    model: UploadFile = Form(...),
    dataset: UploadFile = Form(...),
    target_column: str = Form(...),
    sensitive_columns: str = Form(...),  # JSON string
    evaluation_metrics: str = Form(...),  # JSON string
    fairness_threshold: float = Form(...),
    bias_detection_methods: str = Form(...)  # JSON string
):
    return await handle_evaluation_controller(
        background_tasks=background_tasks,
        model=model,
        dataset=dataset,
        target_column=target_column,
        sensitive_columns=sensitive_columns,
        evaluation_metrics=evaluation_metrics,
        fairness_threshold=fairness_threshold,
        bias_detection_methods=bias_detection_methods,
        tenant=request.headers["x-tenant-id"]
    )



@router.get("/evaluate/status/{evaluation_id}")
async def get_evaluation_status(evaluation_id: str, request: Request):
    return await get_evaluation_status_controller(evaluation_id, request.headers["x-tenant-id"])

@router.get("/evaluate/results/{evaluation_id}")
async def get_evaluation_results(evaluation_id: str, request: Request):
    return await get_evaluation_results_controller(evaluation_id, request.headers["x-tenant-id"])

@router.get("/evaluate/all")
async def get_all_evaluations(request: Request):
    return await get_all_evaluations_controller(request.headers["x-tenant-id"])

@router.delete("/evaluate/{evaluation_id}")
async def cancel_evaluation(evaluation_id: str, request: Request):
    return await cancel_evaluation_controller(evaluation_id, request.headers["x-tenant-id"])

@router.get("/evaluations")
async def get_all_bias_fairness_evaluations(request: Request):
    """Get all bias and fairness evaluations for the current tenant."""
    print(f"Getting all bias and fairness evaluations for tenant: {request.headers['x-tenant-id']}")
    return await get_all_bias_fairness_evaluations_controller(request.headers["x-tenant-id"])

@router.get("/evaluations/{eval_id}")
async def get_bias_fairness_evaluation(eval_id: str, request: Request):
    """Get a specific bias and fairness evaluation by eval_id."""
    return await get_bias_fairness_evaluation_by_id_controller(eval_id, request.headers["x-tenant-id"])

@router.delete("/evaluations/{eval_id}")
async def delete_bias_fairness_evaluation(eval_id: str, request: Request):
    """Delete a bias and fairness evaluation."""
    return await delete_bias_fairness_evaluation_controller(eval_id, request.headers["x-tenant-id"])

@router.get("/metrics/available")
async def get_available_metrics():
    return {"metrics": [
        "demographic_parity",
        "equal_opportunity", 
        "equalized_odds",
        "statistical_parity",
        "predictive_rate_parity",
        "accuracy_parity",
        "calibration_parity"
    ]}

@router.get("/bias-methods/available")
async def get_available_bias_methods():
    return {"methods": [
        "statistical_disparity",
        "counterfactual_fairness", 
        "individual_fairness",
        "group_fairness"
    ]}
