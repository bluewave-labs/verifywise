"""
DeepEval Project Model

Represents a DeepEval project in the database.
"""

from typing import Dict, Any
from datetime import datetime


class DeepEvalProject:
    """
    DeepEval Project model.
    
    Attributes:
        id: Unique project identifier
        name: Project name
        description: Project description
        model: Model configuration (JSON)
        dataset: Dataset configuration (JSON)
        metrics: Enabled metrics (JSON)
        metric_thresholds: Metric thresholds (JSON)
        tenant: Tenant ID
        created_at: Creation timestamp
        updated_at: Last update timestamp
        created_by: Creator identifier
    """
    
    def __init__(
        self,
        id: str,
        name: str,
        description: str,
        model: Dict[str, Any],
        dataset: Dict[str, Any],
        metrics: Dict[str, bool],
        metric_thresholds: Dict[str, float],
        tenant: str,
        created_at: datetime = None,
        updated_at: datetime = None,
        created_by: str = None
    ):
        self.id = id
        self.name = name
        self.description = description
        self.model = model
        self.dataset = dataset
        self.metrics = metrics
        self.metric_thresholds = metric_thresholds
        self.tenant = tenant
        self.created_at = created_at or datetime.now()
        self.updated_at = updated_at or datetime.now()
        self.created_by = created_by
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert project to dictionary."""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "model": self.model,
            "dataset": self.dataset,
            "metrics": self.metrics,
            "metricThresholds": self.metric_thresholds,
            "tenant": self.tenant,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
            "createdBy": self.created_by,
        }

