"""Initial EvalServer tables

Revision ID: 20251212_initial
Revises:
Create Date: 2025-12-12 00:00:00.000000
"""

from typing import Sequence, Union, List
import os
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "20251212_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def _discover_tenant_schemas() -> List[str]:
    conn = op.get_bind()
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
        return ["public"]
    return candidates


def upgrade() -> None:
    """Create all EvalServer tables in each target tenant schema."""
    schemas = _discover_tenant_schemas()
    for schema_name in schemas:
        # Ensure schema exists
        op.execute(sa.text(f'CREATE SCHEMA IF NOT EXISTS "{schema_name}"'))

        # deepeval_organizations table
        op.execute(
            sa.text(
                f"""
                CREATE TABLE IF NOT EXISTS "{schema_name}".deepeval_organizations (
                    id VARCHAR(255) PRIMARY KEY,
                    name VARCHAR(255) NOT NULL UNIQUE,
                    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                    member_ids INTEGER[] NULL
                )
                """
            )
        )

        # deepeval_projects table
        op.execute(
            sa.text(
                f"""
                CREATE TABLE IF NOT EXISTS "{schema_name}".deepeval_projects (
                    id VARCHAR(255) PRIMARY KEY,
                    org_id VARCHAR(255),
                    name VARCHAR(255) NOT NULL,
                    description TEXT,
                    hyperparameters JSONB DEFAULT '{{}}',
                    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                    created_by VARCHAR(255)
                )
                """
            )
        )

        # deepeval_scorers table
        op.execute(
            sa.text(
                f"""
                CREATE TABLE IF NOT EXISTS "{schema_name}".deepeval_scorers (
                    id VARCHAR(255) PRIMARY KEY,
                    project_id VARCHAR(255),
                    name VARCHAR(255) NOT NULL,
                    description TEXT,
                    type VARCHAR(64) NOT NULL,
                    metric_key VARCHAR(255) NOT NULL,
                    config JSONB DEFAULT '{{}}',
                    enabled BOOLEAN DEFAULT TRUE,
                    default_threshold DOUBLE PRECISION,
                    weight DOUBLE PRECISION,
                    tenant VARCHAR(255) NOT NULL,
                    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                    created_by VARCHAR(255)
                )
                """
            )
        )

        # deepeval_user_datasets table
        op.execute(
            sa.text(
                f"""
                CREATE TABLE IF NOT EXISTS "{schema_name}".deepeval_user_datasets (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    path TEXT,
                    size BIGINT,
                    prompt_count INTEGER,
                    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
        )

        # model_files table (for bias and fairness)
        op.execute(
            sa.text(
                f"""
                CREATE TABLE IF NOT EXISTS "{schema_name}".model_files (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    file_content BYTEA,
                    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
        )

        # model_data table (for bias and fairness)
        op.execute(
            sa.text(
                f"""
                CREATE TABLE IF NOT EXISTS "{schema_name}".model_data (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    file_content BYTEA,
                    target_column VARCHAR(255),
                    sensitive_column VARCHAR(255),
                    model_id INTEGER,
                    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
        )

        # fairness_runs table
        op.execute(
            sa.text(
                f"""
                CREATE TABLE IF NOT EXISTS "{schema_name}".fairness_runs (
                    id SERIAL PRIMARY KEY,
                    data_id INTEGER,
                    metrics JSONB,
                    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
        )

        # bias_fairness_evaluations table
        op.execute(
            sa.text(
                f"""
                CREATE TABLE IF NOT EXISTS "{schema_name}".bias_fairness_evaluations (
                    id SERIAL PRIMARY KEY,
                    project_id VARCHAR(255),
                    results JSONB,
                    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
        )

        # evaluation_logs table
        op.execute(
            sa.text(
                f"""
                CREATE TABLE IF NOT EXISTS "{schema_name}".evaluation_logs (
                    id UUID PRIMARY KEY,
                    project_id VARCHAR(255) NOT NULL,
                    experiment_id VARCHAR(255),
                    trace_id UUID,
                    parent_trace_id UUID,
                    span_name VARCHAR(255),
                    input_text TEXT,
                    output_text TEXT,
                    model_name VARCHAR(255),
                    log_metadata JSONB,
                    latency_ms INTEGER,
                    token_count INTEGER,
                    cost NUMERIC(10, 6),
                    status VARCHAR(50),
                    error_message TEXT,
                    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                    tenant VARCHAR(255) NOT NULL,
                    created_by INTEGER
                )
                """
            )
        )

        # evaluation_metrics table
        op.execute(
            sa.text(
                f"""
                CREATE TABLE IF NOT EXISTS "{schema_name}".evaluation_metrics (
                    id UUID PRIMARY KEY,
                    project_id VARCHAR(255) NOT NULL,
                    experiment_id VARCHAR(255),
                    metric_name VARCHAR(255) NOT NULL,
                    metric_type VARCHAR(100) NOT NULL,
                    value DOUBLE PRECISION NOT NULL,
                    dimensions JSONB,
                    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                    tenant VARCHAR(255) NOT NULL
                )
                """
            )
        )

        # experiments table
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
                    status VARCHAR(50) NOT NULL DEFAULT 'pending',
                    results JSONB,
                    error_message TEXT,
                    started_at TIMESTAMPTZ,
                    completed_at TIMESTAMPTZ,
                    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                    tenant VARCHAR(255) NOT NULL,
                    created_by INTEGER
                )
                """
            )
        )

        # Create indexes
        op.execute(
            sa.text(
                f'CREATE INDEX IF NOT EXISTS idx_deepeval_projects_org_id ON "{schema_name}".deepeval_projects(org_id)'
            )
        )
        op.execute(
            sa.text(
                f'CREATE INDEX IF NOT EXISTS idx_deepeval_scorers_tenant ON "{schema_name}".deepeval_scorers(tenant)'
            )
        )
        op.execute(
            sa.text(
                f'CREATE INDEX IF NOT EXISTS idx_deepeval_scorers_project_id ON "{schema_name}".deepeval_scorers(project_id)'
            )
        )
        op.execute(
            sa.text(
                f'CREATE INDEX IF NOT EXISTS idx_evaluation_logs_project_id ON "{schema_name}".evaluation_logs(project_id)'
            )
        )
        op.execute(
            sa.text(
                f'CREATE INDEX IF NOT EXISTS idx_evaluation_logs_experiment_id ON "{schema_name}".evaluation_logs(experiment_id)'
            )
        )
        op.execute(
            sa.text(
                f'CREATE INDEX IF NOT EXISTS idx_evaluation_logs_tenant ON "{schema_name}".evaluation_logs(tenant)'
            )
        )
        op.execute(
            sa.text(
                f'CREATE INDEX IF NOT EXISTS idx_evaluation_logs_timestamp ON "{schema_name}".evaluation_logs(timestamp)'
            )
        )
        op.execute(
            sa.text(
                f'CREATE INDEX IF NOT EXISTS idx_evaluation_metrics_project_id ON "{schema_name}".evaluation_metrics(project_id)'
            )
        )
        op.execute(
            sa.text(
                f'CREATE INDEX IF NOT EXISTS idx_evaluation_metrics_tenant ON "{schema_name}".evaluation_metrics(tenant)'
            )
        )
        op.execute(
            sa.text(
                f'CREATE INDEX IF NOT EXISTS idx_evaluation_metrics_timestamp ON "{schema_name}".evaluation_metrics(timestamp)'
            )
        )
        op.execute(
            sa.text(
                f'CREATE INDEX IF NOT EXISTS idx_experiments_project_id ON "{schema_name}".experiments(project_id)'
            )
        )
        op.execute(
            sa.text(
                f'CREATE INDEX IF NOT EXISTS idx_experiments_tenant ON "{schema_name}".experiments(tenant)'
            )
        )
        op.execute(
            sa.text(
                f'CREATE INDEX IF NOT EXISTS idx_experiments_status ON "{schema_name}".experiments(status)'
            )
        )


def downgrade() -> None:
    """Drop all EvalServer tables in target schemas (idempotent)."""
    schemas = _discover_tenant_schemas()
    for schema_name in schemas:
        op.execute(sa.text(f'DROP TABLE IF EXISTS "{schema_name}".experiments CASCADE'))
        op.execute(sa.text(f'DROP TABLE IF EXISTS "{schema_name}".evaluation_metrics CASCADE'))
        op.execute(sa.text(f'DROP TABLE IF EXISTS "{schema_name}".evaluation_logs CASCADE'))
        op.execute(sa.text(f'DROP TABLE IF EXISTS "{schema_name}".bias_fairness_evaluations CASCADE'))
        op.execute(sa.text(f'DROP TABLE IF EXISTS "{schema_name}".fairness_runs CASCADE'))
        op.execute(sa.text(f'DROP TABLE IF EXISTS "{schema_name}".model_data CASCADE'))
        op.execute(sa.text(f'DROP TABLE IF EXISTS "{schema_name}".model_files CASCADE'))
        op.execute(sa.text(f'DROP TABLE IF EXISTS "{schema_name}".deepeval_user_datasets CASCADE'))
        op.execute(sa.text(f'DROP TABLE IF EXISTS "{schema_name}".deepeval_scorers CASCADE'))
        op.execute(sa.text(f'DROP TABLE IF EXISTS "{schema_name}".deepeval_projects CASCADE'))
        op.execute(sa.text(f'DROP TABLE IF EXISTS "{schema_name}".deepeval_organizations CASCADE'))
