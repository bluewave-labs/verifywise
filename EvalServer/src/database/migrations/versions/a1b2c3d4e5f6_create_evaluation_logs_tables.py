"""create evaluation logs and monitoring tables

Revision ID: a1b2c3d4e5f6
Revises: 9f84d27a3b1c
Create Date: 2025-01-05 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '9f84d27a3b1c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - create evaluation logs, metrics, and experiments tables."""
    
    # Create tables in tenant schema (following existing pattern)
    schema_name = "a4ayc80OGd"  # Default tenant schema
    
    # Ensure schema exists first
    op.execute(sa.text(f'CREATE SCHEMA IF NOT EXISTS "{schema_name}"'))
    
    # Create evaluation_logs table
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
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                tenant VARCHAR(255) NOT NULL,
                created_by INTEGER
            )
            """
        )
    )
    
    # Create indexes for evaluation_logs
    op.execute(sa.text(f'CREATE INDEX IF NOT EXISTS idx_logs_project_id ON "{schema_name}".evaluation_logs(project_id)'))
    op.execute(sa.text(f'CREATE INDEX IF NOT EXISTS idx_logs_experiment_id ON "{schema_name}".evaluation_logs(experiment_id)'))
    op.execute(sa.text(f'CREATE INDEX IF NOT EXISTS idx_logs_trace_id ON "{schema_name}".evaluation_logs(trace_id)'))
    op.execute(sa.text(f'CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON "{schema_name}".evaluation_logs(timestamp)'))
    op.execute(sa.text(f'CREATE INDEX IF NOT EXISTS idx_logs_tenant ON "{schema_name}".evaluation_logs(tenant)'))
    op.execute(sa.text(f'CREATE INDEX IF NOT EXISTS idx_logs_status ON "{schema_name}".evaluation_logs(status)'))
    
    # Create evaluation_metrics table
    op.execute(
        sa.text(
            f"""
            CREATE TABLE IF NOT EXISTS "{schema_name}".evaluation_metrics (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                project_id VARCHAR(255) NOT NULL,
                experiment_id VARCHAR(255),
                metric_name VARCHAR(255) NOT NULL,
                metric_type VARCHAR(50) NOT NULL,
                value DOUBLE PRECISION NOT NULL,
                dimensions JSONB DEFAULT '{{}}',
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                tenant VARCHAR(255) NOT NULL
            )
            """
        )
    )
    
    # Create indexes for evaluation_metrics
    op.execute(sa.text(f'CREATE INDEX IF NOT EXISTS idx_metrics_project_id ON "{schema_name}".evaluation_metrics(project_id)'))
    op.execute(sa.text(f'CREATE INDEX IF NOT EXISTS idx_metrics_experiment_id ON "{schema_name}".evaluation_metrics(experiment_id)'))
    op.execute(sa.text(f'CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON "{schema_name}".evaluation_metrics(timestamp)'))
    op.execute(sa.text(f'CREATE INDEX IF NOT EXISTS idx_metrics_name ON "{schema_name}".evaluation_metrics(metric_name)'))
    op.execute(sa.text(f'CREATE INDEX IF NOT EXISTS idx_metrics_tenant ON "{schema_name}".evaluation_metrics(tenant)'))
    
    # Create experiments table
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
                started_at TIMESTAMP,
                completed_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                tenant VARCHAR(255) NOT NULL,
                created_by INTEGER
            )
            """
        )
    )
    
    # Create indexes for experiments
    op.execute(sa.text(f'CREATE INDEX IF NOT EXISTS idx_experiments_project_id ON "{schema_name}".experiments(project_id)'))
    op.execute(sa.text(f'CREATE INDEX IF NOT EXISTS idx_experiments_status ON "{schema_name}".experiments(status)'))
    op.execute(sa.text(f'CREATE INDEX IF NOT EXISTS idx_experiments_tenant ON "{schema_name}".experiments(tenant)'))
    op.execute(sa.text(f'CREATE INDEX IF NOT EXISTS idx_experiments_created_at ON "{schema_name}".experiments(created_at)'))


def downgrade() -> None:
    """Downgrade schema - drop tables."""
    schema_name = "a4ayc80OGd"
    op.execute(sa.text(f'DROP TABLE IF EXISTS "{schema_name}".evaluation_logs CASCADE'))
    op.execute(sa.text(f'DROP TABLE IF EXISTS "{schema_name}".evaluation_metrics CASCADE'))
    op.execute(sa.text(f'DROP TABLE IF EXISTS "{schema_name}".experiments CASCADE'))

