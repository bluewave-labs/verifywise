"""
Evidently Client - Handles communication with Evidently Cloud
"""
import logging
from typing import List, Dict, Any, Optional
from evidently import CloudWorkspace
import json

logger = logging.getLogger(__name__)

class EvidentlyClient:
    """Client to interact with Evidently Cloud"""

    def __init__(self, url: str, api_token: str):
        """
        Initialize Evidently client

        Args:
            url: Evidently Cloud URL (e.g., https://app.evidently.cloud)
            api_token: API token for authentication
        """
        self.url = url
        self.api_token = api_token
        self.workspace = None

    async def _get_workspace(self) -> CloudWorkspace:
        """Get or create CloudWorkspace instance"""
        if self.workspace is None:
            try:
                self.workspace = CloudWorkspace(
                    token=self.api_token,
                    url=self.url
                )
                logger.info(f"Connected to Evidently workspace at {self.url}")
            except Exception as e:
                logger.error(f"Failed to connect to Evidently workspace: {str(e)}")
                raise
        return self.workspace

    async def test_connection(self) -> bool:
        """
        Test connection to Evidently Cloud

        Returns:
            True if connection successful, False otherwise
        """
        try:
            ws = await self._get_workspace()
            # Try to list projects as a connection test
            projects = ws.list_projects()
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
            ws = await self._get_workspace()
            projects = ws.list_projects()

            # Convert project objects to dictionaries
            projects_list = []
            for project in projects:
                project_dict = {
                    "id": str(project.id),
                    "name": project.name,
                    "description": project.description if hasattr(project, 'description') else None,
                    "created_at": project.date_from.isoformat() if hasattr(project, 'date_from') and project.date_from else None,
                }
                projects_list.append(project_dict)

            logger.info(f"Found {len(projects_list)} projects")
            return projects_list
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
            ws = await self._get_workspace()
            project = ws.get_project(project_id)

            project_dict = {
                "id": str(project.id),
                "name": project.name,
                "description": project.description if hasattr(project, 'description') else None,
                "created_at": project.date_from.isoformat() if hasattr(project, 'date_from') and project.date_from else None,
            }

            logger.info(f"Retrieved project: {project.name}")
            return project_dict
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
            ws = await self._get_workspace()
            project = ws.get_project(project_id)

            # Get snapshots (reports) for the project
            snapshots = ws.search_snapshots(project_id)

            drift_data = {
                "project_id": project_id,
                "project_name": project.name,
                "total_snapshots": len(snapshots),
                "metrics": []
            }

            # Extract drift metrics from snapshots
            for snapshot in snapshots:
                try:
                    # Get snapshot data
                    snapshot_data = snapshot.as_dict() if hasattr(snapshot, 'as_dict') else {}

                    # Look for drift-related metrics
                    metrics_dict = snapshot_data.get('metrics', [])

                    for metric in metrics_dict:
                        metric_type = metric.get('metric', '')
                        if 'drift' in metric_type.lower() or 'DataDrift' in metric_type:
                            drift_data["metrics"].append({
                                "timestamp": snapshot.timestamp.isoformat() if hasattr(snapshot, 'timestamp') else None,
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
                "project_name": "Unknown",
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
            ws = await self._get_workspace()
            project = ws.get_project(project_id)
            snapshots = ws.search_snapshots(project_id)

            performance_data = {
                "project_id": project_id,
                "project_name": project.name,
                "total_snapshots": len(snapshots),
                "metrics": []
            }

            # Extract performance metrics from snapshots
            for snapshot in snapshots:
                try:
                    snapshot_data = snapshot.as_dict() if hasattr(snapshot, 'as_dict') else {}
                    metrics_dict = snapshot_data.get('metrics', [])

                    for metric in metrics_dict:
                        metric_type = metric.get('metric', '')
                        # Look for performance-related metrics
                        performance_keywords = ['accuracy', 'precision', 'recall', 'f1', 'auc', 'roc', 'classification', 'regression', 'quality']
                        if any(keyword in metric_type.lower() for keyword in performance_keywords):
                            performance_data["metrics"].append({
                                "timestamp": snapshot.timestamp.isoformat() if hasattr(snapshot, 'timestamp') else None,
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
                "project_name": "Unknown",
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
            ws = await self._get_workspace()
            project = ws.get_project(project_id)
            snapshots = ws.search_snapshots(project_id)

            fairness_data = {
                "project_id": project_id,
                "project_name": project.name,
                "total_snapshots": len(snapshots),
                "metrics": []
            }

            # Extract fairness metrics from snapshots
            for snapshot in snapshots:
                try:
                    snapshot_data = snapshot.as_dict() if hasattr(snapshot, 'as_dict') else {}
                    metrics_dict = snapshot_data.get('metrics', [])

                    for metric in metrics_dict:
                        metric_type = metric.get('metric', '')
                        # Look for fairness-related metrics
                        fairness_keywords = ['fairness', 'bias', 'demographic', 'parity', 'disparity', 'equalized']
                        if any(keyword in metric_type.lower() for keyword in fairness_keywords):
                            fairness_data["metrics"].append({
                                "timestamp": snapshot.timestamp.isoformat() if hasattr(snapshot, 'timestamp') else None,
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
                "project_name": "Unknown",
                "total_snapshots": 0,
                "metrics": [],
                "error": str(e)
            }
