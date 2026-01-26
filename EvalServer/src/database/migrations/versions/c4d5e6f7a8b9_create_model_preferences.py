"""create-models

Revision ID: c4d5e6f7a8b9
Revises: b3c4d5e6f7a8
Create Date: 2026-01-19

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from database.migrations.util import _discover_tenant_schemas


# revision identifiers, used by Alembic.
revision: str = 'c4d5e6f7a8b9'
down_revision: Union[str, None] = 'b3c4d5e6f7a8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create deepeval_models table for storing saved model configurations."""
    schemas = _discover_tenant_schemas(op, sa)
    conn = op.get_bind()
    
    for schema_name in schemas:
        # Check if the deepeval_organizations table exists in this schema
        result = conn.execute(sa.text(f'''
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = :schema_name 
                AND table_name = 'deepeval_organizations'
            );
        '''), {"schema_name": schema_name})
        table_exists = result.scalar()
        
        if not table_exists:
            print(f"  ⏭ Skipping schema {schema_name} - deepeval_organizations table does not exist")
            continue

        print(f"Creating deepeval_models table in schema: {schema_name}")

        # ============================================================
        # MODELS TABLE (org-scoped)
        # Stores saved model configurations
        # Similar structure to scorers for consistency
        # ============================================================
        op.execute(sa.text(f'''
            CREATE TABLE IF NOT EXISTS "{schema_name}".deepeval_models (
                id VARCHAR(255) PRIMARY KEY,
                org_id VARCHAR(255) NOT NULL REFERENCES "{schema_name}".deepeval_organizations(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                provider VARCHAR(100) NOT NULL,
                endpoint_url TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                created_by VARCHAR(255)
            );
        '''))

        # Indexes
        op.execute(sa.text(f'''
            CREATE INDEX IF NOT EXISTS idx_deepeval_models_org_id 
            ON "{schema_name}".deepeval_models(org_id);
        '''))

        print(f"  ✓ Created deepeval_models table in {schema_name}")
        
        # Also drop old model_preferences table if it exists
        op.execute(sa.text(f'DROP TABLE IF EXISTS "{schema_name}".deepeval_model_preferences CASCADE;'))


def downgrade() -> None:
    """Remove deepeval_models table."""
    schemas = _discover_tenant_schemas(op, sa)
    conn = op.get_bind()
    
    for schema_name in schemas:
        # Check if the table exists before trying to drop
        result = conn.execute(sa.text(f'''
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = :schema_name 
                AND table_name = 'deepeval_models'
            );
        '''), {"schema_name": schema_name})
        table_exists = result.scalar()
        
        if table_exists:
            op.execute(sa.text(f'DROP TABLE IF EXISTS "{schema_name}".deepeval_models CASCADE;'))
