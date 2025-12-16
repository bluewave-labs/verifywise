"""add evals organizations and project org_id

Revision ID: 20251116_evals_orgs
Revises: 20251116_ensure_evals_tables_in_tenant_schemas
Create Date: 2025-11-16 00:00:00.000000
"""
from typing import Sequence, Union, List
from alembic import op
import sqlalchemy as sa
import os

# revision identifiers, used by Alembic.
revision: str = "20251116_evals_orgs"
down_revision: Union[str, None] = "20251116_evals_tenant_schemas"
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
    schemas = _discover_tenant_schemas()
    for schema_name in schemas:
        # Create organizations table
        op.execute(
            sa.text(
                f"""
                CREATE TABLE IF NOT EXISTS "{schema_name}".deepeval_organizations (
                    id VARCHAR(255) PRIMARY KEY,
                    name VARCHAR(255) NOT NULL UNIQUE,
                    member_ids INTEGER[] DEFAULT ARRAY[]::INTEGER[],
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
        )
        # Add org_id to projects if not exists
        op.execute(
            sa.text(
                f"""
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_schema = '{schema_name}'
                          AND table_name = 'deepeval_projects'
                          AND column_name = 'org_id'
                    ) THEN
                        ALTER TABLE "{schema_name}".deepeval_projects
                        ADD COLUMN org_id VARCHAR(255) NULL;
                    END IF;
                END$$;
                """
            )
        )
        # Index on org_id
        op.execute(
            sa.text(
                f'CREATE INDEX IF NOT EXISTS idx_deepeval_projects_org_id ON "{schema_name}".deepeval_projects(org_id)'
            )
        )


def downgrade() -> None:
    schemas = _discover_tenant_schemas()
    for schema_name in schemas:
        op.execute(sa.text(f'ALTER TABLE "{schema_name}".deepeval_projects DROP COLUMN IF EXISTS org_id'))
        op.execute(sa.text(f'DROP TABLE IF EXISTS "{schema_name}".deepeval_organizations'))


