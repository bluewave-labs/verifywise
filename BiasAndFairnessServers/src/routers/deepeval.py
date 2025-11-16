"""
DeepEval Router

Endpoints for running DeepEval LLM evaluations.
"""

from fastapi import APIRouter, BackgroundTasks, Request, Body, HTTPException, UploadFile, File
from controllers.deepeval import (
    create_deepeval_evaluation_controller,
    get_deepeval_evaluation_status_controller,
    get_deepeval_evaluation_results_controller,
    get_all_deepeval_evaluations_controller,
    delete_deepeval_evaluation_controller,
    get_available_deepeval_metrics_controller,
    get_evaluation_dataset_info_controller,
    upload_deepeval_dataset_controller,
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
        tenant=request.headers.get("x-tenant-id", "default")
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
        request.headers.get("x-tenant-id", "default")
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
        request.headers.get("x-tenant-id", "default")
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
        request.headers.get("x-tenant-id", "default")
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
        request.headers.get("x-tenant-id", "default")
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
        tenant=request.headers.get("x-tenant-id", "default"),
    )

