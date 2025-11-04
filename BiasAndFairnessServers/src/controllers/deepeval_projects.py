"""
DeepEval Projects Controller

Manages DeepEval projects (CRUD operations).
"""

import json
from datetime import datetime
from typing import List, Dict, Any
from fastapi import HTTPException
from fastapi.responses import JSONResponse
from database.db import get_db
from crud.deepeval_projects import (
    create_project,
    get_all_projects,
    get_project_by_id,
    update_project,
    delete_project as delete_project_db,
)


async def create_project_controller(
    project_data: dict,
    tenant: str
) -> JSONResponse:
    """
    Create a new DeepEval project.
    
    Args:
        project_data: Project configuration
        tenant: Tenant ID
        
    Returns:
        JSONResponse with created project
    """
    try:
        # Generate project ID
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        project_id = f"project_{timestamp}"
        
        # Get database session
        async with get_db() as db:
            # Create simplified project - only name and description
            # Model configs, datasets, metrics will be part of eval runs
            project = await create_project(
                project_id=project_id,
                name=project_data.get("name"),
                description=project_data.get("description", ""),
                tenant=tenant,
                created_by=tenant,
                db=db
            )
            
            await db.commit()
            
            if not project:
                raise HTTPException(
                    status_code=500,
                    detail="Failed to create project in database"
                )
            
            return JSONResponse(
                status_code=201,
                content={
                    "project": project,
                    "message": "Project created successfully"
                }
            )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create project: {str(e)}"
        )


async def get_all_projects_controller(tenant: str) -> JSONResponse:
    """
    Get all projects for a tenant.
    
    Args:
        tenant: Tenant ID
        
    Returns:
        JSONResponse with projects list
    """
    try:
        async with get_db() as db:
            projects = await get_all_projects(tenant=tenant, db=db)
            
            return JSONResponse(
                status_code=200,
                content={"projects": projects}
            )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch projects: {str(e)}"
        )


async def get_project_controller(
    project_id: str,
    tenant: str
) -> JSONResponse:
    """
    Get a specific project.
    
    Args:
        project_id: Project ID
        tenant: Tenant ID
        
    Returns:
        JSONResponse with project data
    """
    try:
        async with get_db() as db:
            project = await get_project_by_id(
                project_id=project_id,
                tenant=tenant,
                db=db
            )
            
            if not project:
                raise HTTPException(
                    status_code=404,
                    detail=f"Project {project_id} not found"
                )
            
            return JSONResponse(
                status_code=200,
                content={"project": project}
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch project: {str(e)}"
        )


async def update_project_controller(
    project_id: str,
    project_data: dict,
    tenant: str
) -> JSONResponse:
    """
    Update an existing project.
    
    Args:
        project_id: Project ID
        project_data: Updated project data
        tenant: Tenant ID
        
    Returns:
        JSONResponse with updated project
    """
    try:
        async with get_db() as db:
            # Update project in database (only name and description)
            project = await update_project(
                project_id=project_id,
                name=project_data.get("name"),
                description=project_data.get("description"),
                tenant=tenant,
                db=db
            )
            
            await db.commit()
            
            if not project:
                raise HTTPException(
                    status_code=404,
                    detail=f"Project {project_id} not found"
                )
            
            return JSONResponse(
                status_code=200,
                content={
                    "project": project,
                    "message": "Project updated successfully"
                }
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update project: {str(e)}"
        )


async def delete_project_controller(
    project_id: str,
    tenant: str
) -> JSONResponse:
    """
    Delete a project.
    
    Args:
        project_id: Project ID
        tenant: Tenant ID
        
    Returns:
        JSONResponse with deletion confirmation
    """
    try:
        async with get_db() as db:
            # Delete project from database
            deleted = await delete_project_db(
                project_id=project_id,
                tenant=tenant,
                db=db
            )
            
            await db.commit()
            
            if not deleted:
                raise HTTPException(
                    status_code=404,
                    detail=f"Project {project_id} not found"
                )
            
            # TODO: Also delete associated experiments
            
            return JSONResponse(
                status_code=200,
                content={
                    "message": "Project deleted successfully",
                    "projectId": project_id
                }
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete project: {str(e)}"
        )


async def get_project_stats_controller(
    project_id: str,
    tenant: str
) -> JSONResponse:
    """
    Get statistics for a project (number of experiments, avg scores, etc.).
    
    Args:
        project_id: Project ID
        tenant: Tenant ID
        
    Returns:
        JSONResponse with project statistics
    """
    try:
        async with get_db() as db:
            # Verify project exists
            project = await get_project_by_id(
                project_id=project_id,
                tenant=tenant,
                db=db
            )
            
            if not project:
                raise HTTPException(
                    status_code=404,
                    detail=f"Project {project_id} not found"
                )
            
            # TODO: Calculate stats from experiments
            # For now, return mock data
            stats = {
                "projectId": project_id,
                "totalExperiments": 0,
                "lastRunDate": None,
                "avgMetrics": {},
            }
            
            return JSONResponse(
                status_code=200,
                content={"stats": stats}
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch project stats: {str(e)}"
        )

