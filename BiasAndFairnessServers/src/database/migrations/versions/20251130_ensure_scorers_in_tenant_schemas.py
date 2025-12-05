"""ensure deepeval_scorers table exists in tenant schemas

Revision ID: 20251130_scorers_tenant
Revises: 20251130_add_deepeval_scorers
Create Date: 2025-11-30 00:10:00.000000

This mirrors the pattern from 20251116_evals_tenant_schemas so that
scorers are available in the same tenant schemas as experiments/logs.
"""

from typing import Sequence, Union, List
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "20251130_scorers_tenant"
down_revision: Union[str, None] = "20251130_add_deepeval_scorers"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _discover_tenant_schemas() -> List[str]:
    """
    Auto-discover tenant schemas by inspecting the database for schemas
    that contain expected tenant tables (projects/vendors/file_manager),
    matching the logic used in 20251116_evals_tenant_schemas.
    """
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
        return []

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

    return tenant_schemas or candidates


def upgrade() -> None:
    """Ensure deepeval_scorers table exists in all tenant schemas."""
    schemas = _discover_tenant_schemas() or ["public"]
    for schema_name in schemas:
        op.execute(sa.text(f'CREATE SCHEMA IF NOT EXISTS "{schema_name}"'))

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
    """Drop deepeval_scorers in discovered tenant schemas."""
    schemas = _discover_tenant_schemas() or ["public"]
    for schema_name in schemas:
        op.execute(sa.text(f'DROP TABLE IF EXISTS "{schema_name}".deepeval_scorers'))


