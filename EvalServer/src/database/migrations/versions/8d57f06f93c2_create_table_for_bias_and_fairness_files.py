"""create table for bias and fairness files

Revision ID: 8d57f06f93c2
Revises: 
Create Date: 2025-05-29 20:24:34.412799

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8d57f06f93c2'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    """Upgrade schema."""
    queries = [
        """
            CREATE TABLE model_files (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                file_content BYTEA NOT NULL
            );
        """,
        """
            CREATE TABLE model_data (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                file_content BYTEA NOT NULL,
                model_id INTEGER NOT NULL REFERENCES model_files(id) ON DELETE CASCADE
            );
        """
    ]
    for query in queries:
        op.execute(sa.text(query))

def downgrade() -> None:
    """Downgrade schema."""
    queries = [
        "DROP TABLE IF EXISTS model_data;",
        "DROP TABLE IF EXISTS model_files;"
    ]
    for query in queries:
        op.execute(sa.text(query))
