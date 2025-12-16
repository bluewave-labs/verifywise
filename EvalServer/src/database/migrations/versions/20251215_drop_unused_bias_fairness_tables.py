"""Drop unused bias and fairness tables

Revision ID: 20251215_cleanup
Revises: 20251121_prompt_count
Create Date: 2025-12-15

"""
from typing import Sequence, Union, List

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "20251215_cleanup"
down_revision: Union[str, None] = "20251121_prompt_count"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _discover_tenant_schemas() -> List[str]:
    """Discover all tenant schemas in the database."""
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
    """Drop unused bias and fairness tables."""
    schemas = _discover_tenant_schemas()
    for schema_name in schemas:
        # Drop tables that were used for bias/fairness feature (no longer used)
        op.execute(sa.text(f'DROP TABLE IF EXISTS "{schema_name}".fairness_runs CASCADE'))
        op.execute(sa.text(f'DROP TABLE IF EXISTS "{schema_name}".bias_fairness_evaluations CASCADE'))
        op.execute(sa.text(f'DROP TABLE IF EXISTS "{schema_name}".model_data CASCADE'))
        op.execute(sa.text(f'DROP TABLE IF EXISTS "{schema_name}".model_files CASCADE'))


def downgrade() -> None:
    """Recreate the bias and fairness tables if needed."""
    schemas = _discover_tenant_schemas()
    for schema_name in schemas:
        # Recreate model_files table
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
        # Recreate model_data table
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
        # Recreate fairness_runs table
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
        # Recreate bias_fairness_evaluations table
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

