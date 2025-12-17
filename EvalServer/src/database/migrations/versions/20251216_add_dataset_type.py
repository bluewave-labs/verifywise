"""add dataset_type column to deepeval_user_datasets

Revision ID: 20251216_dataset_type
Revises: 20251216_tenant_cols
Create Date: 2025-12-16 02:00:00.000000

Purpose:
- Add dataset_type column to deepeval_user_datasets table
- Supports chatbot, rag, and agent dataset types
"""
from typing import Sequence, Union, List
import os
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "20251216_dataset_type"
down_revision: Union[str, None] = "20251216_tenant_cols"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _discover_tenant_schemas() -> List[str]:
    """
    Auto-discover tenant schemas by inspecting the database for schemas
    that contain expected tenant tables.
    """
    conn = op.get_bind()
    candidates = [
        row[0]
        for row in conn.execute(
            sa.text(
                """
                SELECT schema_name
                FROM information_schema.schemata
                WHERE schema_name NOT IN ('public', 'information_schema')
                  AND schema_name NOT LIKE 'pg_%'
                """
            )
        ).fetchall()
    ]
    if not candidates:
        return []

    tenant_schemas: List[str] = []
    for schema in candidates:
        count = conn.execute(
            sa.text(
                """
                SELECT COUNT(*) 
                FROM information_schema.tables
                WHERE table_schema = :schema
                  AND table_name IN ('projects', 'vendors', 'file_manager', 'deepeval_projects')
                """
            ),
            {"schema": schema},
        ).scalar() or 0
        if count > 0:
            tenant_schemas.append(schema)

    return tenant_schemas or candidates


def _get_target_schemas() -> List[str]:
    raw = os.getenv("TENANT_SCHEMAS", "")
    if raw.strip():
        return [s.strip() for s in raw.split(",") if s.strip()]
    single = os.getenv("TENANT_SCHEMA", "")
    if single.strip():
        return [single.strip()]
    discovered = _discover_tenant_schemas()
    return discovered or ["public"]


def upgrade() -> None:
    """Add dataset_type column to deepeval_user_datasets in each tenant schema."""
    schemas = _get_target_schemas()
    conn = op.get_bind()
    
    for schema_name in schemas:
        # Check if the table exists
        table_exists = conn.execute(
            sa.text(
                """
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.tables
                    WHERE table_schema = :schema
                    AND table_name = 'deepeval_user_datasets'
                )
                """
            ),
            {"schema": schema_name},
        ).scalar()
        
        if not table_exists:
            continue
        
        # Check if dataset_type column already exists
        column_exists = conn.execute(
            sa.text(
                """
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_schema = :schema
                    AND table_name = 'deepeval_user_datasets'
                    AND column_name = 'dataset_type'
                )
                """
            ),
            {"schema": schema_name},
        ).scalar()
        
        if column_exists:
            continue
        
        # Add dataset_type column with default value
        conn.execute(
            sa.text(
                f"ALTER TABLE \"{schema_name}\".deepeval_user_datasets ADD COLUMN dataset_type VARCHAR(50) DEFAULT 'chatbot'"
            )
        )


def downgrade() -> None:
    """Remove dataset_type column from deepeval_user_datasets in each tenant schema."""
    schemas = _get_target_schemas()
    conn = op.get_bind()
    
    for schema_name in schemas:
        column_exists = conn.execute(
            sa.text(
                """
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_schema = :schema
                    AND table_name = 'deepeval_user_datasets'
                    AND column_name = 'dataset_type'
                )
                """
            ),
            {"schema": schema_name},
        ).scalar()
        
        if column_exists:
            conn.execute(
                sa.text(
                    f'ALTER TABLE "{schema_name}".deepeval_user_datasets DROP COLUMN dataset_type'
                )
            )

