"""
Evidently Service - FastAPI microservice to bridge VerifyWise and Evidently Cloud
"""
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import logging
from datetime import datetime

from .evidently_client import EvidentlyClient

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Evidently Service",
    description="Microservice to integrate VerifyWise with Evidently Cloud",
    version="1.0.0"
)

# CORS configuration to allow VerifyWise backend to call this service
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # VerifyWise backend and frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class EvidentlyConfig(BaseModel):
    url: str
    api_token: str

class ProjectListRequest(BaseModel):
    url: str
    api_token: str

class MetricsRequest(BaseModel):
    url: str
    api_token: str
    project_id: str

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "evidently-service",
        "timestamp": datetime.utcnow().isoformat()
    }

# Test connection endpoint
@app.post("/api/evidently/test-connection")
async def test_connection(config: EvidentlyConfig):
    """
    Test connection to Evidently Cloud
    """
    try:
        client = EvidentlyClient(config.url, config.api_token)
        is_connected = await client.test_connection()

        if is_connected:
            return {
                "success": True,
                "message": "Successfully connected to Evidently Cloud"
            }
        else:
            raise HTTPException(status_code=400, detail="Failed to connect to Evidently Cloud")
    except Exception as e:
        logger.error(f"Connection test failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Connection test failed: {str(e)}")

# List projects endpoint
@app.post("/api/evidently/projects")
async def list_projects(request: ProjectListRequest):
    """
    List all projects in Evidently workspace
    """
    try:
        client = EvidentlyClient(request.url, request.api_token)
        projects = await client.list_projects()

        return {
            "success": True,
            "projects": projects
        }
    except Exception as e:
        logger.error(f"Failed to list projects: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to list projects: {str(e)}")

# Get project details endpoint
@app.post("/api/evidently/projects/{project_id}")
async def get_project_details(project_id: str, request: ProjectListRequest):
    """
    Get details for a specific project
    """
    try:
        client = EvidentlyClient(request.url, request.api_token)
        project = await client.get_project(project_id)

        return {
            "success": True,
            "project": project
        }
    except Exception as e:
        logger.error(f"Failed to get project details: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get project details: {str(e)}")

# Get drift metrics endpoint
@app.post("/api/evidently/metrics/drift")
async def get_drift_metrics(request: MetricsRequest):
    """
    Get drift metrics for a specific project
    """
    try:
        client = EvidentlyClient(request.url, request.api_token)
        metrics = await client.get_drift_metrics(request.project_id)

        return {
            "success": True,
            "metrics": metrics
        }
    except Exception as e:
        logger.error(f"Failed to get drift metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get drift metrics: {str(e)}")

# Get performance metrics endpoint
@app.post("/api/evidently/metrics/performance")
async def get_performance_metrics(request: MetricsRequest):
    """
    Get performance metrics for a specific project
    """
    try:
        client = EvidentlyClient(request.url, request.api_token)
        metrics = await client.get_performance_metrics(request.project_id)

        return {
            "success": True,
            "metrics": metrics
        }
    except Exception as e:
        logger.error(f"Failed to get performance metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get performance metrics: {str(e)}")

# Get fairness metrics endpoint
@app.post("/api/evidently/metrics/fairness")
async def get_fairness_metrics(request: MetricsRequest):
    """
    Get fairness metrics for a specific project
    """
    try:
        client = EvidentlyClient(request.url, request.api_token)
        metrics = await client.get_fairness_metrics(request.project_id)

        return {
            "success": True,
            "metrics": metrics
        }
    except Exception as e:
        logger.error(f"Failed to get fairness metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get fairness metrics: {str(e)}")

# Bulk sync endpoint - get all metrics for a project
@app.post("/api/evidently/sync")
async def bulk_sync(request: MetricsRequest):
    """
    Get all metrics (drift, performance, fairness) for a project in one call
    """
    try:
        client = EvidentlyClient(request.url, request.api_token)

        # Fetch all metrics concurrently
        drift_metrics = await client.get_drift_metrics(request.project_id)
        performance_metrics = await client.get_performance_metrics(request.project_id)
        fairness_metrics = await client.get_fairness_metrics(request.project_id)

        return {
            "success": True,
            "project_id": request.project_id,
            "sync_timestamp": datetime.utcnow().isoformat(),
            "data": {
                "drift": drift_metrics,
                "performance": performance_metrics,
                "fairness": fairness_metrics
            }
        }
    except Exception as e:
        logger.error(f"Failed to sync metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to sync metrics: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
