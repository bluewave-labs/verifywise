"""add prompt_count column to deepeval_user_datasets

Revision ID: 20251121_prompt_count
Revises: 20251116_evals_orgs
Create Date: 2025-11-21 06:55:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "20251121_prompt_count"
down_revision: Union[str, None] = "20251116_evals_orgs"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add prompt_count column to all tenant schemas"""
    conn = op.get_bind()
    
    # Get all schemas (excluding system schemas)
    result = conn.execute(sa.text("""
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'public')
        AND schema_name NOT LIKE 'pg_%'
    """))
    
    schemas = [row[0] for row in result.fetchall()]
    
    for schema in schemas:
        # Check if the table exists in this schema
        table_check = conn.execute(sa.text(f"""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = '{schema}' 
                AND table_name = 'deepeval_user_datasets'
            )
        """))
        
        if table_check.scalar():
            # Check if column already exists
            col_check = conn.execute(sa.text(f"""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_schema = '{schema}' 
                AND table_name = 'deepeval_user_datasets' 
                AND column_name = 'prompt_count'
            """))
            
            if not col_check.fetchone():
                # Add the column
                conn.execute(sa.text(f"""
                    ALTER TABLE "{schema}".deepeval_user_datasets 
                    ADD COLUMN prompt_count INTEGER DEFAULT 0
                """))
                print(f"Added prompt_count column to {schema}.deepeval_user_datasets")


def downgrade() -> None:
    """Remove prompt_count column from all tenant schemas"""
    conn = op.get_bind()
    
    result = conn.execute(sa.text("""
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'public')
        AND schema_name NOT LIKE 'pg_%'
    """))
    
    schemas = [row[0] for row in result.fetchall()]
    
    for schema in schemas:
        table_check = conn.execute(sa.text(f"""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = '{schema}' 
                AND table_name = 'deepeval_user_datasets'
            )
        """))
        
        if table_check.scalar():
            conn.execute(sa.text(f"""
                ALTER TABLE "{schema}".deepeval_user_datasets 
                DROP COLUMN IF EXISTS prompt_count
            """))

