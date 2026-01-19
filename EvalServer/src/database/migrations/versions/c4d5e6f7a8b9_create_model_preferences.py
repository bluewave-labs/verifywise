"""create-model-preferences

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
    """Create deepeval_model_preferences table for storing saved model/judge settings."""
    schemas = _discover_tenant_schemas(op, sa)
    conn = op.get_bind()
    
    for schema_name in schemas:
        # Check if the deepeval_projects table exists in this schema before creating dependent table
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

        print(f"Creating deepeval_model_preferences table in schema: {schema_name}")

        # ============================================================
        # MODEL PREFERENCES TABLE
        # Stores saved model and judge preferences per project
        # Auto-loads when creating new experiments
        # ============================================================
        op.execute(sa.text(f'''
            CREATE TABLE IF NOT EXISTS "{schema_name}".deepeval_model_preferences (
                id SERIAL PRIMARY KEY,
                project_id VARCHAR(255) NOT NULL REFERENCES "{schema_name}".deepeval_projects(id) ON DELETE CASCADE,
                user_id INTEGER,
                model_name VARCHAR(255),
                model_access_method VARCHAR(50),
                model_endpoint_url TEXT,
                judge_provider VARCHAR(50),
                judge_model VARCHAR(255),
                judge_temperature DECIMAL(3,2) DEFAULT 0.7,
                judge_max_tokens INTEGER DEFAULT 2048,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        '''))

        # Indexes
        op.execute(sa.text(f'''
            CREATE INDEX IF NOT EXISTS idx_deepeval_model_preferences_project_id 
            ON "{schema_name}".deepeval_model_preferences(project_id);
        '''))
        
        # Unique index: one preference record per project per user (handles NULL user_id)
        op.execute(sa.text(f'''
            CREATE UNIQUE INDEX IF NOT EXISTS idx_deepeval_model_preferences_unique 
            ON "{schema_name}".deepeval_model_preferences(project_id, COALESCE(user_id, 0));
        '''))

        print(f"  ✓ Created deepeval_model_preferences table in {schema_name}")


def downgrade() -> None:
    """Remove deepeval_model_preferences table."""
    schemas = _discover_tenant_schemas(op, sa)
    conn = op.get_bind()
    
    for schema_name in schemas:
        # Check if the table exists before trying to drop
        result = conn.execute(sa.text(f'''
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = :schema_name 
                AND table_name = 'deepeval_model_preferences'
            );
        '''), {"schema_name": schema_name})
        table_exists = result.scalar()
        
        if table_exists:
            op.execute(sa.text(f'DROP TABLE IF EXISTS "{schema_name}".deepeval_model_preferences CASCADE;'))
