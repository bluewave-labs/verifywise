"""ensure evals tables exist in tenant schemas

Revision ID: 20251116_evals_tenant_schemas
Revises: a1b2c3d4e5f6
Create Date: 2025-11-16 00:00:00.000000

Purpose:
- Earlier migrations created some tables in the public schema or a hardcoded schema.
- Our CRUD uses `"tenant_schema".table` (schema-qualified). This migration ensures
  required tables exist in the specified tenant schemas.

Usage:
- Set TENANT_SCHEMAS env var with a comma-separated list of schemas
  (e.g., TENANT_SCHEMAS=a4ayc80OGd,1HNeOiZeFu) before running alembic upgrade.
- If TENANT_SCHEMAS is not set, we will default to the single schema name from
  TENANT_SCHEMA or fall back to 'public'.
"""
from typing import Sequence, Union, List
import os
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "20251116_evals_tenant_schemas"
down_revision: Union[str, None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _discover_tenant_schemas() -> List[str]:
    """
    Auto-discover tenant schemas by inspecting the database for schemas
    that contain expected tenant tables (e.g., projects).
    Falls back to all non-system schemas if specific tables are not found.
    """
    conn = op.get_bind()
    # 1) Candidate non-system schemas
    candidates = [
        row[0]
        for row in conn.execute(
            sa.text(
                """
                SELECT schema_name
                FROM information_schema.schemata
                WHERE schema_name NOT IN ('public', 'information_schema')
                  AND schema_name NOT LIKE 'pg_%'
                """
            )
        ).fetchall()
    ]
    if not candidates:
        return []

    # 2) Filter schemas that already have known tenant tables
    tenant_schemas: List[str] = []
    for schema in candidates:
        count = conn.execute(
            sa.text(
                """
                SELECT COUNT(*) 
                FROM information_schema.tables
                WHERE table_schema = :schema
                  AND table_name IN ('projects', 'vendors', 'file_manager')
                """
            ),
            {"schema": schema},
        ).scalar() or 0
        if count > 0:
            tenant_schemas.append(schema)

    # If we found none with the specific tables, use all candidates
    return tenant_schemas or candidates


def _get_target_schemas() -> List[str]:
    raw = os.getenv("TENANT_SCHEMAS", "")
    if raw.strip():
        return [s.strip() for s in raw.split(",") if s.strip()]
    single = os.getenv("TENANT_SCHEMA", "")
    if single.strip():
        return [single.strip()]
    # Auto-discover from DB; if none found, fallback to 'public'
    discovered = _discover_tenant_schemas()
    return discovered or ["public"]


def upgrade() -> None:
    """Create evals tables in each target tenant schema if missing."""
    schemas = _get_target_schemas()
    for schema_name in schemas:
        # Ensure schema exists
        op.execute(sa.text(f'CREATE SCHEMA IF NOT EXISTS "{schema_name}"'))

        # Projects table
        op.execute(
            sa.text(
                f"""
                CREATE TABLE IF NOT EXISTS "{schema_name}".deepeval_projects (
                    id VARCHAR(255) PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    description TEXT,
                    tenant VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    created_by VARCHAR(255)
                )
                """
            )
        )
        op.execute(
            sa.text(
                f'CREATE INDEX IF NOT EXISTS idx_deepeval_projects_tenant ON "{schema_name}".deepeval_projects(tenant)'
            )
        )
        op.execute(
            sa.text(
                f'CREATE INDEX IF NOT EXISTS idx_deepeval_projects_created_at ON "{schema_name}".deepeval_projects(created_at DESC)'
            )
        )

        # Experiments table
        op.execute(
            sa.text(
                f"""
                CREATE TABLE IF NOT EXISTS "{schema_name}".experiments (
                    id VARCHAR(255) PRIMARY KEY,
                    project_id VARCHAR(255) NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    description TEXT,
                    config JSONB NOT NULL,
                    baseline_experiment_id VARCHAR(255),
                    status VARCHAR(50) DEFAULT 'pending',
                    results JSONB,
                    error_message TEXT,
                    started_at TIMESTAMP WITH TIME ZONE,
                    completed_at TIMESTAMP WITH TIME ZONE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    tenant VARCHAR(255) NOT NULL,
                    created_by INTEGER
                )
                """
            )
        )
        op.execute(
            sa.text(
                f'CREATE INDEX IF NOT EXISTS idx_experiments_project_id ON "{schema_name}".experiments(project_id)'
            )
        )
        op.execute(
            sa.text(
                f'CREATE INDEX IF NOT EXISTS idx_experiments_status ON "{schema_name}".experiments(status)'
            )
        )

        # Evaluation logs
        op.execute(
            sa.text(
                f"""
                CREATE TABLE IF NOT EXISTS "{schema_name}".evaluation_logs (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    project_id VARCHAR(255) NOT NULL,
                    experiment_id VARCHAR(255),
                    trace_id UUID,
                    parent_trace_id UUID,
                    span_name VARCHAR(255),
                    input_text TEXT,
                    output_text TEXT,
                    model_name VARCHAR(255),
                    metadata JSONB DEFAULT '{{}}',
                    latency_ms INTEGER,
                    token_count INTEGER,
                    cost NUMERIC(10, 6),
                    status VARCHAR(50),
                    error_message TEXT,
                    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    tenant VARCHAR(255) NOT NULL,
                    created_by INTEGER
                )
                """
            )
        )
        op.execute(
            sa.text(
                f'CREATE INDEX IF NOT EXISTS idx_logs_project_id ON "{schema_name}".evaluation_logs(project_id)'
            )
        )
        op.execute(
            sa.text(
                f'CREATE INDEX IF NOT EXISTS idx_logs_experiment_id ON "{schema_name}".evaluation_logs(experiment_id)'
            )
        )
        op.execute(
            sa.text(
                f'CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON "{schema_name}".evaluation_logs(timestamp DESC)'
            )
        )

        # Evaluation metrics (time-series)
        op.execute(
            sa.text(
                f"""
                CREATE TABLE IF NOT EXISTS "{schema_name}".evaluation_metrics (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    project_id VARCHAR(255) NOT NULL,
                    experiment_id VARCHAR(255),
                    metric_name VARCHAR(255) NOT NULL,
                    metric_type VARCHAR(255) NOT NULL,
                    value DOUBLE PRECISION NOT NULL,
                    dimensions JSONB,
                    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    tenant VARCHAR(255) NOT NULL
                )
                """
            )
        )
        op.execute(
            sa.text(
                f'CREATE INDEX IF NOT EXISTS idx_metrics_project_id ON "{schema_name}".evaluation_metrics(project_id)'
            )
        )
        op.execute(
            sa.text(
                f'CREATE INDEX IF NOT EXISTS idx_metrics_metric_name ON "{schema_name}".evaluation_metrics(metric_name)'
            )
        )
        op.execute(
            sa.text(
                f'CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON "{schema_name}".evaluation_metrics(timestamp DESC)'
            )
        )


def downgrade() -> None:
    """Drop evals tables in target schemas (idempotent)."""
    schemas = _get_target_schemas()
    for schema_name in schemas:
        op.execute(sa.text(f'DROP TABLE IF EXISTS "{schema_name}".evaluation_metrics'))
        op.execute(sa.text(f'DROP TABLE IF EXISTS "{schema_name}".evaluation_logs'))
        op.execute(sa.text(f'DROP TABLE IF EXISTS "{schema_name}".experiments'))
        op.execute(sa.text(f'DROP TABLE IF EXISTS "{schema_name}".deepeval_projects'))


