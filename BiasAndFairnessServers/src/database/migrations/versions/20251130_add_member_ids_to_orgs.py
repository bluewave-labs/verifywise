"""add member_ids to deepeval_organizations

Revision ID: 20251130_member_ids
Revises: 20251130_ensure_scorers_in_tenant_schemas
Create Date: 2025-11-30 00:00:00.000000
"""
from typing import Sequence, Union, List
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "20251130_member_ids"
down_revision: Union[str, None] = "20251130_scorers_tenant"
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
        # Add member_ids column to organizations if not exists
        op.execute(
            sa.text(
                f"""
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_schema = '{schema_name}'
                          AND table_name = 'deepeval_organizations'
                          AND column_name = 'member_ids'
                    ) THEN
                        ALTER TABLE "{schema_name}".deepeval_organizations
                        ADD COLUMN member_ids INTEGER[] NULL;
                    END IF;
                END$$;
                """
            )
        )


def downgrade() -> None:
    schemas = _discover_tenant_schemas()
    for schema_name in schemas:
        op.execute(
            sa.text(
                f'ALTER TABLE "{schema_name}".deepeval_organizations DROP COLUMN IF EXISTS member_ids'
            )
        )
