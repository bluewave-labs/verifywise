"""create table for bias and fairness evaluations

Revision ID: d606d35c94c5
Revises: 7e483c3a8e0c
Create Date: 2025-08-21 08:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd606d35c94c5'
down_revision: Union[str, None] = '7e483c3a8e0c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create the table
    op.execute(
        sa.text(
            """
                CREATE TABLE bias_fairness_evaluations (
                    id SERIAL PRIMARY KEY,
                    eval_id VARCHAR(255) UNIQUE NOT NULL,
                    model_name VARCHAR(255) NOT NULL,
                    dataset_name VARCHAR(255) NOT NULL,
                    model_task VARCHAR(100) NOT NULL,
                    label_behavior VARCHAR(50) NOT NULL,
                    config_data JSONB NOT NULL,
                    status VARCHAR(50) NOT NULL DEFAULT 'pending',
                    results JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    tenant VARCHAR(255) NOT NULL
                );
            """
        )
    )
    
    # Create indexes
    op.execute(
        sa.text(
            "CREATE INDEX idx_bias_fairness_evaluations_tenant ON bias_fairness_evaluations(tenant);"
        )
    )
    
    op.execute(
        sa.text(
            "CREATE INDEX idx_bias_fairness_evaluations_status ON bias_fairness_evaluations(status);"
        )
    )
    
    op.execute(
        sa.text(
            "CREATE INDEX idx_bias_fairness_evaluations_eval_id ON bias_fairness_evaluations(eval_id);"
        )
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.execute(
        sa.text(
            """
                DROP TABLE IF EXISTS bias_fairness_evaluations CASCADE;
            """
        )
    )
