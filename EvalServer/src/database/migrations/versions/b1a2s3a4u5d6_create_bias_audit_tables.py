"""create-bias-audit-tables

Revision ID: b1a2s3a4u5d6
Revises: f7a8b9c0d1e2
Create Date: 2026-02-13

Creates llm_evals_bias_audits and llm_evals_bias_audit_results tables
in each tenant schema for the bias audit module.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from database.migrations.util import _discover_tenant_schemas


# revision identifiers, used by Alembic.
revision: str = 'b1a2s3a4u5d6'
down_revision: Union[str, None] = 'f7a8b9c0d1e2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create bias audit tables in all tenant schemas."""
    schemas = _discover_tenant_schemas(op, sa)
    for schema_name in schemas:
        print(f"Creating bias audit tables in schema: {schema_name}")

        # ============================================================
        # 1. BIAS AUDITS TABLE
        # ============================================================
        op.execute(sa.text(f'''
            CREATE TABLE IF NOT EXISTS "{schema_name}".llm_evals_bias_audits (
                id VARCHAR(255) PRIMARY KEY,
                org_id VARCHAR(255) NOT NULL,
                project_id VARCHAR(255),
                preset_id VARCHAR(100) NOT NULL,
                preset_name VARCHAR(255) NOT NULL,
                mode VARCHAR(50) NOT NULL,
                status VARCHAR(50) NOT NULL DEFAULT 'pending',
                config JSONB NOT NULL,
                results JSONB,
                error TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP WITH TIME ZONE,
                created_by VARCHAR(255)
            );
        '''))
        op.execute(sa.text(f'''
            CREATE INDEX IF NOT EXISTS idx_llm_evals_bias_audits_org_id
            ON "{schema_name}".llm_evals_bias_audits(org_id);
        '''))
        op.execute(sa.text(f'''
            CREATE INDEX IF NOT EXISTS idx_llm_evals_bias_audits_status
            ON "{schema_name}".llm_evals_bias_audits(status);
        '''))
        op.execute(sa.text(f'''
            CREATE INDEX IF NOT EXISTS idx_llm_evals_bias_audits_project_id
            ON "{schema_name}".llm_evals_bias_audits(project_id);
        '''))
        op.execute(sa.text(f'''
            CREATE INDEX IF NOT EXISTS idx_llm_evals_bias_audits_created_at
            ON "{schema_name}".llm_evals_bias_audits(created_at DESC);
        '''))

        # ============================================================
        # 2. BIAS AUDIT RESULTS TABLE (per-group breakdown)
        # ============================================================
        op.execute(sa.text(f'''
            CREATE TABLE IF NOT EXISTS "{schema_name}".llm_evals_bias_audit_results (
                id SERIAL PRIMARY KEY,
                audit_id VARCHAR(255) NOT NULL REFERENCES "{schema_name}".llm_evals_bias_audits(id) ON DELETE CASCADE,
                category_type VARCHAR(100) NOT NULL,
                category_name VARCHAR(255) NOT NULL,
                applicant_count INTEGER NOT NULL,
                selected_count INTEGER NOT NULL,
                selection_rate DOUBLE PRECISION NOT NULL,
                impact_ratio DOUBLE PRECISION,
                excluded BOOLEAN DEFAULT FALSE,
                flagged BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        '''))
        op.execute(sa.text(f'''
            CREATE INDEX IF NOT EXISTS idx_llm_evals_bias_audit_results_audit_id
            ON "{schema_name}".llm_evals_bias_audit_results(audit_id);
        '''))

        print(f"  ✓ Created bias audit tables in {schema_name}")


def downgrade() -> None:
    """Drop bias audit tables from all tenant schemas."""
    schemas = _discover_tenant_schemas(op, sa)
    for schema_name in schemas:
        op.execute(sa.text(f'DROP TABLE IF EXISTS "{schema_name}".llm_evals_bias_audit_results CASCADE;'))
        op.execute(sa.text(f'DROP TABLE IF EXISTS "{schema_name}".llm_evals_bias_audits CASCADE;'))
