"""Cleanup public schema - remove tables that should only exist in tenant schemas

Revision ID: 20251220_cleanup_public
Revises: 20251220_add_missing
Create Date: 2025-12-20

Purpose:
- Remove fairness_runs from public (was never dropped from public, only from tenant schemas)
- Remove deepeval_projects from public (should only exist in tenant schemas)
- These tables were created by older migrations before multi-tenancy was properly implemented
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "20251220_cleanup_public"
down_revision: Union[str, None] = "20251220_missing_evals"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Remove tables from public schema that should only be in tenant schemas."""
    # Drop fairness_runs from public - this was the old bias/fairness feature table
    op.execute(sa.text('DROP TABLE IF EXISTS public.fairness_runs CASCADE'))
    
    # Drop deepeval_projects from public - should only exist in tenant schemas
    op.execute(sa.text('DROP TABLE IF EXISTS public.deepeval_projects CASCADE'))
    
    # Also clean up any other legacy bias/fairness tables from public
    op.execute(sa.text('DROP TABLE IF EXISTS public.bias_fairness_evaluations CASCADE'))
    
    # Drop indexes that may have been created in public
    op.execute(sa.text('DROP INDEX IF EXISTS public.idx_deepeval_projects_tenant'))
    op.execute(sa.text('DROP INDEX IF EXISTS public.idx_deepeval_projects_created_at'))


def downgrade() -> None:
    """Recreate tables in public if needed (not recommended)."""
    # We don't want to recreate these in public - they belong in tenant schemas
    # But for migration reversibility, we provide empty downgrade
    pass

