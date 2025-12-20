"""add missing evals tables to tenant schemas

Revision ID: 20251220_missing_evals
Revises: 20251216_add_dataset_type
Create Date: 2025-12-20 00:00:00.000000

Purpose:
- Add deepeval_scorers and deepeval_user_datasets tables to all tenant schemas
- These tables were previously only created by Node.js createNewTenant script
- This ensures all existing tenants have these tables
"""
from typing import Sequence, Union, List
import os
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "20251220_missing_evals"
down_revision: Union[str, None] = "20251216_dataset_type"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _discover_tenant_schemas() -> List[str]:
    """
    Auto-discover tenant schemas by inspecting the database for schemas
    that contain expected tenant tables (e.g., projects).
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
                  AND table_name IN ('projects', 'vendors', 'file_manager')
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
    # Auto-discover from DB; if none found, fallback to 'public'
    discovered = _discover_tenant_schemas()
    return discovered or ["public"]


def upgrade() -> None:
    """Create deepeval_scorers and deepeval_user_datasets tables in each tenant schema."""
    schemas = _get_target_schemas()
    conn = op.get_bind()
    
    for schema_name in schemas:
        print(f"Adding missing evals tables to schema: {schema_name}")
        
        # Ensure schema exists
        op.execute(sa.text(f'CREATE SCHEMA IF NOT EXISTS "{schema_name}"'))

        # deepeval_user_datasets table
        op.execute(
            sa.text(
                f"""
                CREATE TABLE IF NOT EXISTS "{schema_name}".deepeval_user_datasets (
                    id VARCHAR(255) PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    path VARCHAR(255) NOT NULL,
                    use_case VARCHAR(255) NOT NULL,
                    turn_type VARCHAR(50) DEFAULT 'single-turn',
                    dataset_type VARCHAR(50) DEFAULT 'chatbot',
                    prompt_count INTEGER DEFAULT 0,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    tenant VARCHAR(255) NOT NULL
                )
                """
            )
        )
        op.execute(
            sa.text(
                f'CREATE INDEX IF NOT EXISTS idx_deepeval_user_datasets_tenant ON "{schema_name}".deepeval_user_datasets(tenant)'
            )
        )
        op.execute(
            sa.text(
                f'CREATE INDEX IF NOT EXISTS idx_deepeval_user_datasets_use_case ON "{schema_name}".deepeval_user_datasets(use_case)'
            )
        )

        # deepeval_scorers table
        op.execute(
            sa.text(
                f"""
                CREATE TABLE IF NOT EXISTS "{schema_name}".deepeval_scorers (
                    id VARCHAR(255) PRIMARY KEY,
                    project_id VARCHAR(255),
                    name VARCHAR(255) NOT NULL,
                    description TEXT,
                    type VARCHAR(255) NOT NULL,
                    metric_key VARCHAR(255) NOT NULL,
                    config JSONB DEFAULT '{{}}',
                    enabled BOOLEAN DEFAULT true,
                    default_threshold DOUBLE PRECISION,
                    weight DOUBLE PRECISION,
                    tenant VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    created_by VARCHAR(255)
                )
                """
            )
        )
        op.execute(
            sa.text(
                f'CREATE INDEX IF NOT EXISTS idx_deepeval_scorers_tenant ON "{schema_name}".deepeval_scorers(tenant)'
            )
        )
        op.execute(
            sa.text(
                f'CREATE INDEX IF NOT EXISTS idx_deepeval_scorers_project_id ON "{schema_name}".deepeval_scorers(project_id)'
            )
        )

        # deepeval_organizations table (if missing)
        op.execute(
            sa.text(
                f"""
                CREATE TABLE IF NOT EXISTS "{schema_name}".deepeval_organizations (
                    id VARCHAR(255) PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    description TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    tenant VARCHAR(255) NOT NULL
                )
                """
            )
        )
        op.execute(
            sa.text(
                f'CREATE INDEX IF NOT EXISTS idx_deepeval_orgs_tenant ON "{schema_name}".deepeval_organizations(tenant)'
            )
        )
        
        print(f"  ✓ Added missing tables to {schema_name}")


def downgrade() -> None:
    """Drop the added tables (idempotent)."""
    schemas = _get_target_schemas()
    for schema_name in schemas:
        op.execute(sa.text(f'DROP TABLE IF EXISTS "{schema_name}".deepeval_scorers'))
        op.execute(sa.text(f'DROP TABLE IF EXISTS "{schema_name}".deepeval_user_datasets'))
        op.execute(sa.text(f'DROP TABLE IF EXISTS "{schema_name}".deepeval_organizations'))

