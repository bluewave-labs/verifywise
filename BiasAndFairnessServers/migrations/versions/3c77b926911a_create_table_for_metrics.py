"""create table for metrics

Revision ID: 3c77b926911a
Revises: 8d57f06f93c2
Create Date: 2025-05-31 11:00:48.023566

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3c77b926911a'
down_revision: Union[str, None] = '8d57f06f93c2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute(
        sa.text(
            """
                CREATE TABLE fairness_runs (
                    id SERIAL PRIMARY KEY,
                    data_id INTEGER NOT NULL REFERENCES model_data(id) ON DELETE CASCADE,
                    metrics JSONB NOT NULL
                );
            """
        )
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.execute(
        sa.text(
            """
                DROP TABLE IF EXISTS fairness_runs CASCADE;
            """
        )
    )
