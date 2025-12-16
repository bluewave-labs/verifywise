"""add tenant column to deepeval_user_datasets and deepeval_organizations

Revision ID: 20251216_tenant_cols
Revises: 20251215_cleanup
Create Date: 2025-12-16 00:00:00.000000

Purpose:
- Add tenant column to deepeval_user_datasets and deepeval_organizations tables
- Ensures proper multi-tenancy support with both schema isolation AND tenant column filtering
"""
from typing import Sequence, Union, List
import os
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "20251216_tenant_cols"
down_revision: Union[str, None] = "20251215_cleanup"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _discover_tenant_schemas() -> List[str]:
    """
    Auto-discover tenant schemas by inspecting the database for schemas
    that contain expected tenant tables.
    """
    conn = op.get_bind()
    # Candidate non-system schemas
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

    # Filter schemas that have known tenant tables
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


def _add_tenant_column_to_table(conn, schema_name: str, table_name: str) -> None:
    """Helper to add tenant column to a table if it doesn't exist."""
    # Check if the table exists
    table_exists = conn.execute(
        sa.text(
            """
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables
                WHERE table_schema = :schema
                AND table_name = :table_name
            )
            """
        ),
        {"schema": schema_name, "table_name": table_name},
    ).scalar()
    
    if not table_exists:
        return
    
    # Check if tenant column already exists
    column_exists = conn.execute(
        sa.text(
            """
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = :schema
                AND table_name = :table_name
                AND column_name = 'tenant'
            )
            """
        ),
        {"schema": schema_name, "table_name": table_name},
    ).scalar()
    
    if column_exists:
        return
    
    # Add tenant column (nullable first)
    conn.execute(
        sa.text(
            f'ALTER TABLE "{schema_name}".{table_name} ADD COLUMN tenant VARCHAR(255)'
        )
    )
    
    # Set default value for existing rows
    # For the default schema, use "default" as the tenant value
    tenant_value = "default" if schema_name == "a4ayc80OGd" else schema_name
    conn.execute(
        sa.text(
            f"UPDATE \"{schema_name}\".{table_name} SET tenant = '{tenant_value}' WHERE tenant IS NULL"
        )
    )
    
    # Make column NOT NULL
    conn.execute(
        sa.text(
            f'ALTER TABLE "{schema_name}".{table_name} ALTER COLUMN tenant SET NOT NULL'
        )
    )
    
    # Add index for tenant column
    conn.execute(
        sa.text(
            f'CREATE INDEX IF NOT EXISTS idx_{table_name}_tenant ON "{schema_name}".{table_name}(tenant)'
        )
    )


def upgrade() -> None:
    """Add tenant column to deepeval_user_datasets and deepeval_organizations in each tenant schema."""
    schemas = _get_target_schemas()
    conn = op.get_bind()
    
    for schema_name in schemas:
        # Add tenant column to deepeval_user_datasets
        _add_tenant_column_to_table(conn, schema_name, "deepeval_user_datasets")
        
        # Add tenant column to deepeval_organizations
        _add_tenant_column_to_table(conn, schema_name, "deepeval_organizations")


def _remove_tenant_column_from_table(conn, schema_name: str, table_name: str) -> None:
    """Helper to remove tenant column from a table if it exists."""
    column_exists = conn.execute(
        sa.text(
            """
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = :schema
                AND table_name = :table_name
                AND column_name = 'tenant'
            )
            """
        ),
        {"schema": schema_name, "table_name": table_name},
    ).scalar()
    
    if column_exists:
        conn.execute(
            sa.text(
                f'DROP INDEX IF EXISTS "{schema_name}".idx_{table_name}_tenant'
            )
        )
        conn.execute(
            sa.text(
                f'ALTER TABLE "{schema_name}".{table_name} DROP COLUMN tenant'
            )
        )


def downgrade() -> None:
    """Remove tenant column from deepeval_user_datasets and deepeval_organizations in each tenant schema."""
    schemas = _get_target_schemas()
    conn = op.get_bind()
    
    for schema_name in schemas:
        _remove_tenant_column_from_table(conn, schema_name, "deepeval_user_datasets")
        _remove_tenant_column_from_table(conn, schema_name, "deepeval_organizations")

