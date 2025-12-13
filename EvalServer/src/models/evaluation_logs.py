"""SQLAlchemy models for evaluation logs, metrics, and experiments"""

from sqlalchemy import Column, String, Integer, Text, DateTime, Numeric, Float
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from database.db import Base
import uuid


class EvaluationLog(Base):
    """Model for evaluation logs - tracks individual model interactions"""
    __tablename__ = "evaluation_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(String, nullable=False, index=True)
    experiment_id = Column(String, nullable=True, index=True)
    trace_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    parent_trace_id = Column(UUID(as_uuid=True), nullable=True)
    span_name = Column(String, nullable=True)
    input_text = Column(Text, nullable=True)
    output_text = Column(Text, nullable=True)
    model_name = Column(String, nullable=True)
    log_metadata = Column(JSONB, nullable=True)
    latency_ms = Column(Integer, nullable=True)
    token_count = Column(Integer, nullable=True)
    cost = Column(Numeric(10, 6), nullable=True)
    status = Column(String, nullable=True)  # success, error, pending
    error_message = Column(Text, nullable=True)
    timestamp = Column(DateTime, nullable=False, server_default=func.now(), index=True)
    tenant = Column(String, nullable=False, index=True)
    created_by = Column(Integer, nullable=True)

    def to_dict(self):
        return {
            "id": str(self.id),
            "project_id": self.project_id,
            "experiment_id": self.experiment_id,
            "trace_id": str(self.trace_id) if self.trace_id else None,
            "parent_trace_id": str(self.parent_trace_id) if self.parent_trace_id else None,
            "span_name": self.span_name,
            "input": self.input_text,
            "output": self.output_text,
            "model_name": self.model_name,
            "metadata": self.log_metadata,
            "latency_ms": self.latency_ms,
            "token_count": self.token_count,
            "cost": float(self.cost) if self.cost else None,
            "status": self.status,
            "error_message": self.error_message,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "tenant": self.tenant,
            "created_by": self.created_by,
        }


class EvaluationMetric(Base):
    """Model for time-series evaluation metrics"""
    __tablename__ = "evaluation_metrics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(String, nullable=False, index=True)
    experiment_id = Column(String, nullable=True, index=True)
    metric_name = Column(String, nullable=False, index=True)
    metric_type = Column(String, nullable=False)  # performance, quality, system
    value = Column(Float, nullable=False)
    dimensions = Column(JSONB, nullable=True)
    timestamp = Column(DateTime, nullable=False, server_default=func.now(), index=True)
    tenant = Column(String, nullable=False, index=True)

    def to_dict(self):
        return {
            "id": str(self.id),
            "project_id": self.project_id,
            "experiment_id": self.experiment_id,
            "metric_name": self.metric_name,
            "metric_type": self.metric_type,
            "value": self.value,
            "dimensions": self.dimensions,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "tenant": self.tenant,
        }


class Experiment(Base):
    """Model for experiments - evaluation runs"""
    __tablename__ = "experiments"

    id = Column(String, primary_key=True)
    project_id = Column(String, nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    config = Column(JSONB, nullable=False)  # Contains model, dataset, metrics configuration
    baseline_experiment_id = Column(String, nullable=True)
    status = Column(String, nullable=False, default="pending", index=True)
    results = Column(JSONB, nullable=True)
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now(), index=True)
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
    tenant = Column(String, nullable=False, index=True)
    created_by = Column(Integer, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "project_id": self.project_id,
            "name": self.name,
            "description": self.description,
            "config": self.config,
            "baseline_experiment_id": self.baseline_experiment_id,
            "status": self.status,
            "results": self.results,
            "error_message": self.error_message,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "tenant": self.tenant,
            "created_by": self.created_by,
        }

