"""add target and sensitive column in model_data table

Revision ID: 7e483c3a8e0c
Revises: 3c77b926911a
Create Date: 2025-05-31 11:35:26.790317

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7e483c3a8e0c'
down_revision: Union[str, None] = '3c77b926911a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute(
        sa.text(
            """
                ALTER TABLE model_data
                    ADD COLUMN target_column VARCHAR(255) NOT NULL,
                    ADD COLUMN sensitive_column VARCHAR(255) NOT NULL;
            """
        )
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.execute(
        sa.text(
            """
                ALTER TABLE model_data
                    DROP COLUMN IF EXISTS target_column,
                    DROP COLUMN IF EXISTS sensitive_column;
            """
        )
    )
