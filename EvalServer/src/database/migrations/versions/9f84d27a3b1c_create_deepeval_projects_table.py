"""create deepeval_projects table

Revision ID: 9f84d27a3b1c
Revises: 7e483c3a8e0c
Create Date: 2025-11-04 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9f84d27a3b1c'
down_revision: Union[str, None] = '7e483c3a8e0c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create simplified projects table - just name and description
    # Model configs, datasets, metrics will be part of individual eval runs
    op.execute(
        sa.text(
            """
            CREATE TABLE IF NOT EXISTS deepeval_projects (
                id VARCHAR(255) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                tenant VARCHAR(255) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                created_by VARCHAR(255)
            )
            """
        )
    )
    
    # Create indexes (separate statements for asyncpg compatibility)
    op.execute(
        sa.text(
            """
            CREATE INDEX IF NOT EXISTS idx_deepeval_projects_tenant 
            ON deepeval_projects(tenant)
            """
        )
    )
    
    op.execute(
        sa.text(
            """
            CREATE INDEX IF NOT EXISTS idx_deepeval_projects_created_at 
            ON deepeval_projects(created_at DESC)
            """
        )
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.execute(
        sa.text(
            """
                DROP TABLE IF EXISTS deepeval_projects CASCADE;
            """
        )
    )

