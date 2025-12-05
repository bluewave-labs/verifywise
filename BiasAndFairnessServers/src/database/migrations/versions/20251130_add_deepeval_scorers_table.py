"""add deepeval_scorers table in tenant schemas

Revision ID: 20251130_add_deepeval_scorers
Revises: 20251116_evals_tenant_schemas
Create Date: 2025-11-30 00:00:00.000000
"""

from typing import Sequence, Union, List
import os
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "20251130_add_deepeval_scorers"
down_revision: Union[str, None] = "20251116_evals_tenant_schemas"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _get_target_schemas() -> List[str]:
    raw = os.getenv("TENANT_SCHEMAS", "")
    if raw.strip():
        return [s.strip() for s in raw.split(",") if s.strip()]
    single = os.getenv("TENANT_SCHEMA", "")
    if single.strip():
        return [single.strip()]
    # Fallback: ensure table in public schema so migrations succeed locally
    return ["public"]


def upgrade() -> None:
    """Create deepeval_scorers table in each target tenant schema if missing."""
    schemas = _get_target_schemas()
    for schema_name in schemas:
        # Ensure schema exists
        op.execute(sa.text(f'CREATE SCHEMA IF NOT EXISTS "{schema_name}"'))

        # Core table for scorer definitions
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

        # Helpful indexes
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
                f'CREATE INDEX IF NOT EXISTS idx_deepeval_scorers_metric_key ON "{schema_name}".deepeval_scorers(metric_key)'
            )
        )


def downgrade() -> None:
    """Drop deepeval_scorers table in target schemas (idempotent)."""
    schemas = _get_target_schemas()
    for schema_name in schemas:
        op.execute(sa.text(f'DROP TABLE IF EXISTS "{schema_name}".deepeval_scorers'))


