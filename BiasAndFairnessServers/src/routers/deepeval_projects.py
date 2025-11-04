"""
DeepEval Projects Router

API endpoints for managing DeepEval projects.
"""

from fastapi import APIRouter, Request, Body, HTTPException
from controllers.deepeval_projects import (
    create_project_controller,
    get_all_projects_controller,
    get_project_controller,
    update_project_controller,
    delete_project_controller,
    get_project_stats_controller,
)

router = APIRouter()


@router.post("/projects")
async def create_project(request: Request, project_data: dict = Body(...)):
    """
    Create a new DeepEval project.
    
    Request body:
    {
        "name": "Coding Tasks Evaluation",
        "description": "Evaluating model performance on coding tasks",
        "model": {
            "name": "TinyLlama/TinyLlama-1.1B-Chat-v1.0",
            "provider": "huggingface",
            "generation": {
                "maxTokens": 500,
                "temperature": 0.7,
                "topP": 0.9
            }
        },
        "dataset": {
            "useBuiltin": true,
            "categories": ["coding", "mathematics"],
            "limit": 10
        },
        "metrics": {
            "answerRelevancy": true,
            "bias": true,
            "toxicity": true
        },
        "metricThresholds": {
            "answerRelevancy": 0.5,
            "bias": 0.5,
            "toxicity": 0.5
        }
    }
    """
    return await create_project_controller(
        project_data=project_data,
        tenant=request.headers.get("x-tenant-id", "default")
    )


@router.get("/projects")
async def get_all_projects(request: Request):
    """
    Get all DeepEval projects for the current tenant.
    
    Returns:
    {
        "projects": [
            {
                "id": "project_123",
                "name": "Coding Tasks Evaluation",
                "description": "...",
                "model": {...},
                "createdAt": "2025-01-30T12:00:00"
            },
            ...
        ]
    }
    """
    return await get_all_projects_controller(
        tenant=request.headers.get("x-tenant-id", "default")
    )


@router.get("/projects/{project_id}")
async def get_project(project_id: str, request: Request):
    """
    Get a specific project by ID.
    """
    return await get_project_controller(
        project_id=project_id,
        tenant=request.headers.get("x-tenant-id", "default")
    )


@router.put("/projects/{project_id}")
async def update_project(
    project_id: str,
    request: Request,
    project_data: dict = Body(...)
):
    """
    Update an existing project.
    """
    return await update_project_controller(
        project_id=project_id,
        project_data=project_data,
        tenant=request.headers.get("x-tenant-id", "default")
    )


@router.delete("/projects/{project_id}")
async def delete_project(project_id: str, request: Request):
    """
    Delete a project and all its associated experiments.
    """
    return await delete_project_controller(
        project_id=project_id,
        tenant=request.headers.get("x-tenant-id", "default")
    )


@router.get("/projects/{project_id}/stats")
async def get_project_stats(project_id: str, request: Request):
    """
    Get project statistics (number of experiments, avg metrics, etc.).
    
    Returns:
    {
        "stats": {
            "projectId": "project_123",
            "totalExperiments": 12,
            "lastRunDate": "2025-01-30T12:00:00",
            "avgMetrics": {
                "answerRelevancy": 0.85,
                "bias": 0.05,
                "toxicity": 0.02
            }
        }
    }
    """
    return await get_project_stats_controller(
        project_id=project_id,
        tenant=request.headers.get("x-tenant-id", "default")
    )

