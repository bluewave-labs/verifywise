"""clear the table sturctures

Revision ID: ebcda740fb1a
Revises: 20251220_cleanup_public
Create Date: 2025-12-22 14:13:00.691516

"""
from typing import Sequence, Union, List
import os
from alembic import op
import sqlalchemy as sa
from util import _discover_tenant_schemas


# revision identifiers, used by Alembic.
revision: str = 'ebcda740fb1a'
down_revision: Union[str, None] = '20251220_cleanup_public'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    """Upgrade schema."""
    schemas = _discover_tenant_schemas(op, sa)
    op.execute(sa.text("DROP TABLE IF EXISTS public.fairness_runs;"))
    op.execute(sa.text("DROP TABLE IF EXISTS public.model_data;"))
    op.execute(sa.text("DROP TABLE IF EXISTS public.model_files;"))
    op.execute(sa.text("DROP TABLE IF EXISTS public.deepeval_projects;"))
    for schema_name in schemas:
        op.execute(sa.text(f'DROP TABLE IF EXISTS "{schema_name}".deepeval_organizations;'))
        op.execute(sa.text(f'DROP TABLE IF EXISTS "{schema_name}".deepeval_projects;'))
        op.execute(sa.text(f'DROP TABLE IF EXISTS "{schema_name}".experiments;'))
        op.execute(sa.text(f'DROP TABLE IF EXISTS "{schema_name}".evaluation_logs;'))
        op.execute(sa.text(f'DROP TABLE IF EXISTS "{schema_name}".evaluation_metrics;'))
        op.execute(sa.text(f'DROP TABLE IF EXISTS "{schema_name}".deepeval_user_datasets;'))
        op.execute(sa.text(f'DROP TABLE IF EXISTS "{schema_name}".deepeval_scorers;'))

def downgrade() -> None:
    """Downgrade schema."""
    pass
