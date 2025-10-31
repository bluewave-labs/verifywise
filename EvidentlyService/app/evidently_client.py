"""
Evidently Client - Handles communication with Evidently Cloud via REST API
"""
import logging
from typing import List, Dict, Any, Optional
import httpx
import json

logger = logging.getLogger(__name__)

class EvidentlyClient:
    """Client to interact with Evidently Cloud using direct HTTP API calls"""

    def __init__(self, url: str, api_token: str):
        """
        Initialize Evidently client

        Args:
            url: Evidently Cloud URL (e.g., https://app.evidently.cloud)
            api_token: API token for authentication
        """
        self.url = url.rstrip('/')
        self.api_token = api_token
        self.headers = {
            "Authorization": f"Bearer {api_token}",
            "Content-Type": "application/json"
        }

    async def _make_request(self, method: str, endpoint: str, **kwargs) -> Dict[str, Any]:
        """
        Make HTTP request to Evidently API

        Args:
            method: HTTP method (GET, POST, etc.)
            endpoint: API endpoint path
            **kwargs: Additional arguments for httpx request

        Returns:
            Response JSON as dictionary
        """
        url = f"{self.url}/api{endpoint}"

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.request(
                    method=method,
                    url=url,
                    headers=self.headers,
                    **kwargs
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                logger.error(f"HTTP error {e.response.status_code}: {e.response.text}")
                raise
            except Exception as e:
                logger.error(f"Request failed: {str(e)}")
                raise

    async def test_connection(self) -> bool:
        """
        Test connection to Evidently Cloud

        Returns:
            True if connection successful, False otherwise
        """
        try:
            # Try to list projects as a connection test
            await self._make_request("GET", "/projects")
            logger.info("Connection test successful")
            return True
        except Exception as e:
            logger.error(f"Connection test failed: {str(e)}")
            return False

    async def list_projects(self) -> List[Dict[str, Any]]:
        """
        List all projects in the workspace

        Returns:
            List of project dictionaries
        """
        try:
            response = await self._make_request("GET", "/projects")
            projects = response.get("projects", [])
            logger.info(f"Found {len(projects)} projects")
            return projects
        except Exception as e:
            logger.error(f"Failed to list projects: {str(e)}")
            raise

    async def get_project(self, project_id: str) -> Dict[str, Any]:
        """
        Get details for a specific project

        Args:
            project_id: Project ID

        Returns:
            Project dictionary
        """
        try:
            response = await self._make_request("GET", f"/projects/{project_id}")
            project = response.get("project", {})
            logger.info(f"Retrieved project: {project.get('name', project_id)}")
            return project
        except Exception as e:
            logger.error(f"Failed to get project: {str(e)}")
            raise

    async def get_drift_metrics(self, project_id: str) -> Dict[str, Any]:
        """
        Get drift metrics for a project

        Args:
            project_id: Project ID

        Returns:
            Dictionary containing drift metrics
        """
        try:
            # Get snapshots (reports) for the project
            response = await self._make_request("GET", f"/projects/{project_id}/reports")
            snapshots = response.get("reports", [])

            drift_data = {
                "project_id": project_id,
                "total_snapshots": len(snapshots),
                "metrics": []
            }

            # Extract drift metrics from snapshots
            for snapshot in snapshots:
                try:
                    metrics_list = snapshot.get('metrics', [])

                    for metric in metrics_list:
                        metric_type = metric.get('metric', '')
                        # Look for drift-related metrics
                        if 'drift' in metric_type.lower() or 'DataDrift' in metric_type:
                            drift_data["metrics"].append({
                                "timestamp": snapshot.get('timestamp'),
                                "metric_type": metric_type,
                                "result": metric.get('result', {}),
                            })
                except Exception as e:
                    logger.warning(f"Error processing snapshot: {str(e)}")
                    continue

            logger.info(f"Retrieved {len(drift_data['metrics'])} drift metrics")
            return drift_data
        except Exception as e:
            logger.error(f"Failed to get drift metrics: {str(e)}")
            # Return empty structure instead of raising
            return {
                "project_id": project_id,
                "total_snapshots": 0,
                "metrics": [],
                "error": str(e)
            }

    async def get_performance_metrics(self, project_id: str) -> Dict[str, Any]:
        """
        Get performance metrics for a project

        Args:
            project_id: Project ID

        Returns:
            Dictionary containing performance metrics
        """
        try:
            response = await self._make_request("GET", f"/projects/{project_id}/reports")
            snapshots = response.get("reports", [])

            performance_data = {
                "project_id": project_id,
                "total_snapshots": len(snapshots),
                "metrics": []
            }

            # Extract performance metrics from snapshots
            for snapshot in snapshots:
                try:
                    metrics_list = snapshot.get('metrics', [])

                    for metric in metrics_list:
                        metric_type = metric.get('metric', '')
                        # Look for performance-related metrics
                        performance_keywords = ['accuracy', 'precision', 'recall', 'f1', 'auc', 'roc', 'classification', 'regression', 'quality']
                        if any(keyword in metric_type.lower() for keyword in performance_keywords):
                            performance_data["metrics"].append({
                                "timestamp": snapshot.get('timestamp'),
                                "metric_type": metric_type,
                                "result": metric.get('result', {}),
                            })
                except Exception as e:
                    logger.warning(f"Error processing snapshot: {str(e)}")
                    continue

            logger.info(f"Retrieved {len(performance_data['metrics'])} performance metrics")
            return performance_data
        except Exception as e:
            logger.error(f"Failed to get performance metrics: {str(e)}")
            return {
                "project_id": project_id,
                "total_snapshots": 0,
                "metrics": [],
                "error": str(e)
            }

    async def get_fairness_metrics(self, project_id: str) -> Dict[str, Any]:
        """
        Get fairness metrics for a project

        Args:
            project_id: Project ID

        Returns:
            Dictionary containing fairness metrics
        """
        try:
            response = await self._make_request("GET", f"/projects/{project_id}/reports")
            snapshots = response.get("reports", [])

            fairness_data = {
                "project_id": project_id,
                "total_snapshots": len(snapshots),
                "metrics": []
            }

            # Extract fairness metrics from snapshots
            for snapshot in snapshots:
                try:
                    metrics_list = snapshot.get('metrics', [])

                    for metric in metrics_list:
                        metric_type = metric.get('metric', '')
                        # Look for fairness-related metrics
                        fairness_keywords = ['fairness', 'bias', 'demographic', 'parity', 'disparity', 'equalized']
                        if any(keyword in metric_type.lower() for keyword in fairness_keywords):
                            fairness_data["metrics"].append({
                                "timestamp": snapshot.get('timestamp'),
                                "metric_type": metric_type,
                                "result": metric.get('result', {}),
                            })
                except Exception as e:
                    logger.warning(f"Error processing snapshot: {str(e)}")
                    continue

            logger.info(f"Retrieved {len(fairness_data['metrics'])} fairness metrics")
            return fairness_data
        except Exception as e:
            logger.error(f"Failed to get fairness metrics: {str(e)}")
            return {
                "project_id": project_id,
                "total_snapshots": 0,
                "metrics": [],
                "error": str(e)
            }
