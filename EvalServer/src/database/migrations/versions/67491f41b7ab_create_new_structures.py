"""create-new-structures

Revision ID: 67491f41b7ab
Revises: ebcda740fb1a
Create Date: 2025-12-22 16:26:54.168234

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from util import _discover_tenant_schemas


# revision identifiers, used by Alembic.
revision: str = '67491f41b7ab'
down_revision: Union[str, None] = 'ebcda740fb1a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    schemas = _discover_tenant_schemas(op, sa)
    for schema_name in schemas:
        print(f"Creating deepeval tables in schema: {schema_name}")

        # ============================================================
        # 1. ORGANIZATIONS TABLE
        # ============================================================
        op.execute(sa.text(f'''
            CREATE TABLE IF NOT EXISTS "{schema_name}".deepeval_organizations (
                id VARCHAR(255) PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                description TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        '''))

        # ============================================================
        # 2. ORG MEMBERS TABLE (join table for many-to-many)
        # ============================================================
        op.execute(sa.text(f'''
            CREATE TABLE IF NOT EXISTS "{schema_name}".deepeval_org_members (
                org_id VARCHAR(255) NOT NULL REFERENCES "{schema_name}".deepeval_organizations(id) ON DELETE CASCADE,
                user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
                role VARCHAR(50) DEFAULT 'member',
                joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (org_id, user_id)
            );
        '''))
        op.execute(sa.text(f'''
            CREATE INDEX IF NOT EXISTS idx_deepeval_org_members_user_id 
            ON "{schema_name}".deepeval_org_members(user_id);
        '''))

        # ============================================================
        # 3. PROJECTS TABLE
        # ============================================================
        op.execute(sa.text(f'''
            CREATE TABLE IF NOT EXISTS "{schema_name}".deepeval_projects (
                id VARCHAR(255) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                org_id VARCHAR(255) NOT NULL REFERENCES "{schema_name}".deepeval_organizations(id) ON DELETE CASCADE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                created_by VARCHAR(255)
            );
        '''))
        op.execute(sa.text(f'''
            CREATE INDEX IF NOT EXISTS idx_deepeval_projects_org_id 
            ON "{schema_name}".deepeval_projects(org_id);
        '''))
        op.execute(sa.text(f'''
            CREATE INDEX IF NOT EXISTS idx_deepeval_projects_created_at 
            ON "{schema_name}".deepeval_projects(created_at DESC);
        '''))

        # ============================================================
        # 4. USER DATASETS TABLE (org-scoped)
        # ============================================================
        op.execute(sa.text(f'''
            CREATE TABLE IF NOT EXISTS "{schema_name}".deepeval_user_datasets (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                path TEXT NOT NULL,
                size BIGINT NOT NULL DEFAULT 0,
                prompt_count INTEGER DEFAULT 0,
                dataset_type VARCHAR(50) DEFAULT 'chatbot',
                turn_type VARCHAR(50) DEFAULT 'single-turn',
                org_id VARCHAR(255) NOT NULL REFERENCES "{schema_name}".deepeval_organizations(id) ON DELETE CASCADE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        '''))
        op.execute(sa.text(f'''
            CREATE INDEX IF NOT EXISTS idx_deepeval_user_datasets_org_id 
            ON "{schema_name}".deepeval_user_datasets(org_id);
        '''))
        op.execute(sa.text(f'''
            CREATE INDEX IF NOT EXISTS idx_deepeval_user_datasets_dataset_type 
            ON "{schema_name}".deepeval_user_datasets(dataset_type);
        '''))

        # ============================================================
        # 5. SCORERS TABLE (org-scoped)
        # ============================================================
        op.execute(sa.text(f'''
            CREATE TABLE IF NOT EXISTS "{schema_name}".deepeval_scorers (
                id VARCHAR(255) PRIMARY KEY,
                org_id VARCHAR(255) NOT NULL REFERENCES "{schema_name}".deepeval_organizations(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                type VARCHAR(255) NOT NULL,
                metric_key VARCHAR(255) NOT NULL,
                config JSONB DEFAULT '{{}}',
                enabled BOOLEAN DEFAULT true,
                default_threshold DOUBLE PRECISION,
                weight DOUBLE PRECISION,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                created_by VARCHAR(255)
            );
        '''))
        op.execute(sa.text(f'''
            CREATE INDEX IF NOT EXISTS idx_deepeval_scorers_org_id 
            ON "{schema_name}".deepeval_scorers(org_id);
        '''))
        op.execute(sa.text(f'''
            CREATE INDEX IF NOT EXISTS idx_deepeval_scorers_enabled 
            ON "{schema_name}".deepeval_scorers(enabled);
        '''))

        # ============================================================
        # 6. EXPERIMENTS TABLE (project-scoped)
        # ============================================================
        op.execute(sa.text(f'''
            CREATE TABLE IF NOT EXISTS "{schema_name}".experiments (
                id VARCHAR(255) PRIMARY KEY,
                project_id VARCHAR(255) NOT NULL REFERENCES "{schema_name}".deepeval_projects(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                config JSONB NOT NULL,
                baseline_experiment_id VARCHAR(255) REFERENCES "{schema_name}".experiments(id) ON DELETE SET NULL,
                status VARCHAR(50) DEFAULT 'pending',
                results JSONB,
                error_message TEXT,
                started_at TIMESTAMP WITH TIME ZONE,
                completed_at TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                created_by VARCHAR(255)
            );
        '''))
        op.execute(sa.text(f'''
            CREATE INDEX IF NOT EXISTS idx_experiments_project_id 
            ON "{schema_name}".experiments(project_id);
        '''))
        op.execute(sa.text(f'''
            CREATE INDEX IF NOT EXISTS idx_experiments_status 
            ON "{schema_name}".experiments(status);
        '''))
        op.execute(sa.text(f'''
            CREATE INDEX IF NOT EXISTS idx_experiments_created_at 
            ON "{schema_name}".experiments(created_at DESC);
        '''))

        # ============================================================
        # 7. EVALUATION LOGS TABLE
        # ============================================================
        op.execute(sa.text(f'''
            CREATE TABLE IF NOT EXISTS "{schema_name}".evaluation_logs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                project_id VARCHAR(255) NOT NULL REFERENCES "{schema_name}".deepeval_projects(id) ON DELETE CASCADE,
                experiment_id VARCHAR(255) REFERENCES "{schema_name}".experiments(id) ON DELETE CASCADE,
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
                created_by VARCHAR(255)
            );
        '''))
        op.execute(sa.text(f'''
            CREATE INDEX IF NOT EXISTS idx_evaluation_logs_project_id 
            ON "{schema_name}".evaluation_logs(project_id);
        '''))
        op.execute(sa.text(f'''
            CREATE INDEX IF NOT EXISTS idx_evaluation_logs_experiment_id 
            ON "{schema_name}".evaluation_logs(experiment_id);
        '''))
        op.execute(sa.text(f'''
            CREATE INDEX IF NOT EXISTS idx_evaluation_logs_timestamp 
            ON "{schema_name}".evaluation_logs(timestamp DESC);
        '''))
        op.execute(sa.text(f'''
            CREATE INDEX IF NOT EXISTS idx_evaluation_logs_trace_id 
            ON "{schema_name}".evaluation_logs(trace_id);
        '''))

        # ============================================================
        # 8. EVALUATION METRICS TABLE
        # ============================================================
        op.execute(sa.text(f'''
            CREATE TABLE IF NOT EXISTS "{schema_name}".evaluation_metrics (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                project_id VARCHAR(255) NOT NULL REFERENCES "{schema_name}".deepeval_projects(id) ON DELETE CASCADE,
                experiment_id VARCHAR(255) REFERENCES "{schema_name}".experiments(id) ON DELETE CASCADE,
                metric_name VARCHAR(255) NOT NULL,
                metric_type VARCHAR(255) NOT NULL,
                value DOUBLE PRECISION NOT NULL,
                dimensions JSONB,
                timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        '''))
        op.execute(sa.text(f'''
            CREATE INDEX IF NOT EXISTS idx_evaluation_metrics_project_id 
            ON "{schema_name}".evaluation_metrics(project_id);
        '''))
        op.execute(sa.text(f'''
            CREATE INDEX IF NOT EXISTS idx_evaluation_metrics_experiment_id 
            ON "{schema_name}".evaluation_metrics(experiment_id);
        '''))
        op.execute(sa.text(f'''
            CREATE INDEX IF NOT EXISTS idx_evaluation_metrics_metric_name 
            ON "{schema_name}".evaluation_metrics(metric_name);
        '''))
        op.execute(sa.text(f'''
            CREATE INDEX IF NOT EXISTS idx_evaluation_metrics_timestamp 
            ON "{schema_name}".evaluation_metrics(timestamp DESC);
        '''))

        print(f"  ✓ Created all deepeval tables in {schema_name}")

def downgrade() -> None:
    """Downgrade schema."""
    schemas = _discover_tenant_schemas(op, sa)
    for schema_name in schemas:
        op.execute(sa.text(f'DROP TABLE IF EXISTS "{schema_name}".deepeval_organizations;'))
        op.execute(sa.text(f'DROP TABLE IF EXISTS "{schema_name}".deepeval_projects;'))
        op.execute(sa.text(f'DROP TABLE IF EXISTS "{schema_name}".deepeval_user_datasets;'))
        op.execute(sa.text(f'DROP TABLE IF EXISTS "{schema_name}".deepeval_scorers;'))
        op.execute(sa.text(f'DROP TABLE IF EXISTS "{schema_name}".experiments;'))
        op.execute(sa.text(f'DROP TABLE IF EXISTS "{schema_name}".evaluation_logs;'))
        op.execute(sa.text(f'DROP TABLE IF EXISTS "{schema_name}".evaluation_metrics;'))
