"""add_use_case_to_projects

Revision ID: b3c4d5e6f7a8
Revises: a1b2c3d4e5f6
Create Date: 2026-01-04

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from database.migrations.util import _discover_tenant_schemas


# revision identifiers, used by Alembic.
revision: str = 'b3c4d5e6f7a8'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add use_case column to deepeval_projects table."""
    schemas = _discover_tenant_schemas(op, sa)
    conn = op.get_bind()
    
    for schema_name in schemas:
        # Check if the table exists in this schema before trying to alter it
        result = conn.execute(sa.text(f'''
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = :schema_name 
                AND table_name = 'deepeval_projects'
            );
        '''), {"schema_name": schema_name})
        table_exists = result.scalar()
        
        if not table_exists:
            print(f"  ⏭ Skipping schema {schema_name} - deepeval_projects table does not exist")
            continue
            
        print(f"Adding use_case column to deepeval_projects in schema: {schema_name}")
        
        # Add use_case column with default value 'chatbot'
        op.execute(sa.text(f'''
            ALTER TABLE "{schema_name}".deepeval_projects 
            ADD COLUMN IF NOT EXISTS use_case VARCHAR(50) DEFAULT 'chatbot';
        '''))
        
        print(f"  ✓ Added use_case column to {schema_name}.deepeval_projects")


def downgrade() -> None:
    """Remove use_case column from deepeval_projects table."""
    schemas = _discover_tenant_schemas(op, sa)
    conn = op.get_bind()
    
    for schema_name in schemas:
        # Check if the table exists in this schema
        result = conn.execute(sa.text(f'''
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = :schema_name 
                AND table_name = 'deepeval_projects'
            );
        '''), {"schema_name": schema_name})
        table_exists = result.scalar()
        
        if not table_exists:
            continue
            
        op.execute(sa.text(f'''
            ALTER TABLE "{schema_name}".deepeval_projects 
            DROP COLUMN IF EXISTS use_case;
        '''))

