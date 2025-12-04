"""
DeepEval Router

Endpoints for running DeepEval LLM evaluations.
"""

from fastapi import APIRouter, BackgroundTasks, Request, Body, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse
from pathlib import Path
import json
from controllers.deepeval import (
    create_deepeval_evaluation_controller,
    get_deepeval_evaluation_status_controller,
    get_deepeval_evaluation_results_controller,
    get_all_deepeval_evaluations_controller,
    delete_deepeval_evaluation_controller,
    get_available_deepeval_metrics_controller,
    get_evaluation_dataset_info_controller,
    upload_deepeval_dataset_controller,
    list_deepeval_datasets_controller,
    read_deepeval_dataset_controller,
    list_user_datasets_controller,
    delete_user_datasets_controller,
    list_deepeval_scorers_controller,
    create_deepeval_scorer_controller,
    update_deepeval_scorer_controller,
    delete_deepeval_scorer_controller,
)

router = APIRouter()


@router.post("/evaluate")
async def create_deepeval_evaluation(
    request: Request,
    background_tasks: BackgroundTasks,
    config_data: dict = Body(...)
):
    """
    Create and run a DeepEval evaluation.
    
    Request body:
    {
        "model": {
            "name": "TinyLlama/TinyLlama-1.1B-Chat-v1.0",
            "provider": "huggingface",
            "generation": {
                "max_tokens": 500,
                "temperature": 0.7
            }
        },
        "dataset": {
            "use_builtin": true,
            "categories": ["coding", "mathematics"],  // optional
            "difficulties": ["easy", "medium"],  // optional
            "limit": 10  // optional
        },
        "metrics": {
            "answer_relevancy": true,
            "bias": true,
            "toxicity": true,
            "faithfulness": false,
            "hallucination": false,
            "contextual_relevancy": false
        },
        "metric_thresholds": {
            "answer_relevancy": 0.5,
            "bias": 0.5,
            "toxicity": 0.5
        }
    }
    """
    return await create_deepeval_evaluation_controller(
        background_tasks=background_tasks,
        config_data=config_data,
        tenant=getattr(request.state, "tenant", request.headers.get("x-tenant-id", "default"))
    )


@router.get("/evaluate/status/{eval_id}")
async def get_evaluation_status(eval_id: str, request: Request):
    """
    Get the status of a DeepEval evaluation.
    
    Returns:
    {
        "eval_id": "deepeval_20250130_120000",
        "status": "running" | "completed" | "failed",
        "progress": "3/10 prompts evaluated",
        "created_at": "2025-01-30T12:00:00",
        "updated_at": "2025-01-30T12:01:30"
    }
    """
    return await get_deepeval_evaluation_status_controller(
        eval_id,
        getattr(request.state, "tenant", request.headers.get("x-tenant-id", "default"))
    )


@router.get("/evaluate/results/{eval_id}")
async def get_evaluation_results(eval_id: str, request: Request):
    """
    Get the results of a completed DeepEval evaluation.
    
    Returns:
    {
        "eval_id": "deepeval_20250130_120000",
        "status": "completed",
        "results": {
            "model": "TinyLlama/TinyLlama-1.1B-Chat-v1.0",
            "total_samples": 10,
            "metric_summaries": {
                "answer_relevancy": {
                    "average_score": 0.745,
                    "pass_rate": 80.0,
                    "min_score": 0.267,
                    "max_score": 1.0
                },
                "bias": {...},
                "toxicity": {...}
            },
            "category_breakdown": {...},
            "detailed_results": [...]
        }
    }
    """
    return await get_deepeval_evaluation_results_controller(
        eval_id,
        getattr(request.state, "tenant", request.headers.get("x-tenant-id", "default"))
    )


@router.get("/evaluations")
async def get_all_evaluations(request: Request):
    """
    Get all DeepEval evaluations for the current tenant.
    
    Returns:
    {
        "evaluations": [
            {
                "eval_id": "deepeval_20250130_120000",
                "status": "completed",
                "model": "TinyLlama/TinyLlama-1.1B-Chat-v1.0",
                "total_samples": 10,
                "created_at": "2025-01-30T12:00:00",
                "completed_at": "2025-01-30T12:05:30"
            },
            ...
        ]
    }
    """
    return await get_all_deepeval_evaluations_controller(
        getattr(request.state, "tenant", request.headers.get("x-tenant-id", "default"))
    )


@router.delete("/evaluations/{eval_id}")
async def delete_evaluation(eval_id: str, request: Request):
    """
    Delete a DeepEval evaluation and its results.
    
    Returns:
    {
        "message": "Evaluation deleted successfully",
        "eval_id": "deepeval_20250130_120000"
    }
    """
    return await delete_deepeval_evaluation_controller(
        eval_id,
        getattr(request.state, "tenant", request.headers.get("x-tenant-id", "default"))
    )


@router.get("/metrics/available")
async def get_available_metrics():
    """
    Get list of available DeepEval metrics.
    
    Returns:
    {
        "metrics": [
            {
                "name": "answer_relevancy",
                "description": "Measures if the answer is relevant to the input",
                "requires_context": false,
                "requires_openai_key": true
            },
            ...
        ]
    }
    """
    return await get_available_deepeval_metrics_controller()


@router.get("/dataset/info")
async def get_dataset_info():
    """
    Get information about the evaluation dataset.
    
    Returns:
    {
        "total_prompts": 20,
        "categories": ["coding", "mathematics", "reasoning", ...],
        "difficulties": ["easy", "medium", "hard"],
        "category_counts": {
            "coding": 3,
            "mathematics": 3,
            ...
        }
    }
    """
    return await get_evaluation_dataset_info_controller()


@router.post("/datasets/upload")
async def upload_dataset(request: Request, dataset: UploadFile = File(...)):
    """
    Upload a custom JSON dataset to be used in evaluations.
    
    Returns:
    {
        "message": "Dataset uploaded successfully",
        "path": "data/uploads/{tenant}/{filename}.json",
        "filename": "{filename}.json",
        "size": 12345,
        "tenant": "default"
    }
    """
    return await upload_deepeval_dataset_controller(
        dataset=dataset,
        tenant=getattr(request.state, "tenant", request.headers.get("x-tenant-id", "default")),
    )

@router.get("/datasets/list")
async def list_datasets():
    """
    List available built-in datasets grouped by use case.
    """
    return await list_deepeval_datasets_controller()

@router.get("/datasets/read")
async def read_dataset(path: str):
    """
    Read and return the JSON content of a dataset file by relative path.
    Example: /deepeval/datasets/read?path=chatbot/chatbot_basic.json
    """
    return await read_deepeval_dataset_controller(path)

@router.get("/datasets/uploads")
async def list_uploaded_datasets(request: Request):
    """
    List uploaded JSON datasets for the current tenant from EvaluationModule/data/uploads/{tenant}.
    """
    try:
        tenant = getattr(request.state, "tenant", request.headers.get("x-tenant-id", "default"))
        uploads_dir = Path(__file__).parents[2] / "EvaluationModule" / "data" / "uploads" / tenant
        uploads = []
        if uploads_dir.is_dir():
            for p in uploads_dir.glob("*.json"):
                stat = p.stat()
                uploads.append({
                    "name": p.name,
                    "path": str((Path("data") / "uploads" / tenant / p.name).as_posix()),
                    "size": stat.st_size,
                    "modifiedAt": stat.st_mtime,
                })
        return JSONResponse(status_code=200, content={"uploads": uploads})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list uploads: {e}")

@router.get("/datasets/user")
async def list_user_datasets(request: Request):
    """
    List user-uploaded datasets from DB for the current tenant.
    """
    tenant = getattr(request.state, "tenant", request.headers.get("x-tenant-id", "default"))
    return await list_user_datasets_controller(tenant=tenant)

@router.delete("/datasets/user")
async def delete_user_datasets(request: Request):
    """
    Delete user-uploaded datasets from DB and filesystem for the current tenant.
    Expects JSON body with {"paths": ["path1", "path2", ...]}
    """
    tenant = getattr(request.state, "tenant", request.headers.get("x-tenant-id", "default"))
    body = await request.json()
    paths = body.get("paths", [])
    return await delete_user_datasets_controller(tenant=tenant, paths=paths)


# ==================== SCORERS ====================

@router.get("/scorers")
async def list_scorers_endpoint(request: Request, project_id: str | None = None):
    """
    List scorer definitions for the current tenant (optionally for a single project).
    """
    tenant = getattr(request.state, "tenant", request.headers.get("x-tenant-id", "default"))
    return await list_deepeval_scorers_controller(tenant=tenant, project_id=project_id)


@router.post("/scorers")
async def create_scorer_endpoint(request: Request, payload: dict = Body(...)):
    """
    Create a new scorer definition.
    """
    tenant = getattr(request.state, "tenant", request.headers.get("x-tenant-id", "default"))
    return await create_deepeval_scorer_controller(tenant=tenant, payload=payload)


@router.put("/scorers/{scorer_id}")
async def update_scorer_endpoint(request: Request, scorer_id: str, payload: dict = Body(...)):
    """
    Update an existing scorer definition.
    """
    tenant = getattr(request.state, "tenant", request.headers.get("x-tenant-id", "default"))
    return await update_deepeval_scorer_controller(scorer_id, tenant=tenant, payload=payload)


@router.delete("/scorers/{scorer_id}")
async def delete_scorer_endpoint(request: Request, scorer_id: str):
    """
    Delete a scorer definition.
    """
    tenant = getattr(request.state, "tenant", request.headers.get("x-tenant-id", "default"))
    return await delete_deepeval_scorer_controller(scorer_id, tenant=tenant)

