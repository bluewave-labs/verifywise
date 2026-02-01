"""create-arena-comparisons

Revision ID: a1b2c3d4e5f6
Revises: 67491f41b7ab
Create Date: 2025-12-29 22:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from database.migrations.util import _discover_tenant_schemas


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '67491f41b7ab'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - Add arena comparisons table."""
    schemas = _discover_tenant_schemas(op, sa)
    for schema_name in schemas:
        print(f"Creating arena_comparisons table in schema: {schema_name}")

        # ============================================================
        # ARENA COMPARISONS TABLE
        # For LLM Arena head-to-head comparisons using ArenaGEval
        # ============================================================
        op.execute(sa.text(f'''
            CREATE TABLE IF NOT EXISTS "{schema_name}".deepeval_arena_comparisons (
                id VARCHAR(255) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                org_id VARCHAR(255) REFERENCES "{schema_name}".deepeval_organizations(id) ON DELETE CASCADE,
                contestants JSONB NOT NULL DEFAULT '[]',
                contestant_names JSONB NOT NULL DEFAULT '[]',
                metric_config JSONB NOT NULL DEFAULT '{{}}',
                judge_model VARCHAR(255) DEFAULT 'gpt-4o',
                status VARCHAR(50) DEFAULT 'pending',
                progress TEXT,
                winner VARCHAR(255),
                win_counts JSONB DEFAULT '{{}}',
                detailed_results JSONB DEFAULT '[]',
                error_message TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP WITH TIME ZONE,
                created_by VARCHAR(255)
            );
        '''))

        # Indexes for arena comparisons
        op.execute(sa.text(f'''
            CREATE INDEX IF NOT EXISTS idx_deepeval_arena_comparisons_org_id 
            ON "{schema_name}".deepeval_arena_comparisons(org_id);
        '''))
        op.execute(sa.text(f'''
            CREATE INDEX IF NOT EXISTS idx_deepeval_arena_comparisons_status 
            ON "{schema_name}".deepeval_arena_comparisons(status);
        '''))
        op.execute(sa.text(f'''
            CREATE INDEX IF NOT EXISTS idx_deepeval_arena_comparisons_created_at 
            ON "{schema_name}".deepeval_arena_comparisons(created_at DESC);
        '''))

        print(f"  ✓ Created deepeval_arena_comparisons table in {schema_name}")


def downgrade() -> None:
    """Downgrade schema - Remove arena comparisons table."""
    schemas = _discover_tenant_schemas(op, sa)
    for schema_name in schemas:
        op.execute(sa.text(f'DROP TABLE IF EXISTS "{schema_name}".deepeval_arena_comparisons CASCADE;'))

