"""rename-llm_eval-to-llm_evals

Revision ID: f7a8b9c0d1e2
Revises: e6f7a8b9c0d1
Create Date: 2026-01-19

Renames all llm_eval_* tables to llm_evals_* prefix (adds 's' to evals).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from database.migrations.util import _discover_tenant_schemas


# revision identifiers, used by Alembic.
revision: str = 'f7a8b9c0d1e2'
down_revision: Union[str, None] = 'e6f7a8b9c0d1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Table renames: old_name -> new_name
TABLE_RENAMES = [
    # Must rename in order due to foreign key dependencies
    ('llm_eval_metrics', 'llm_evals_metrics'),
    ('llm_eval_logs', 'llm_evals_logs'),
    ('llm_eval_experiments', 'llm_evals_experiments'),
    ('llm_eval_api_keys', 'llm_evals_api_keys'),
    ('evaluation_llm_api_keys', 'llm_evals_api_keys'),  # Also catch old name if not renamed yet
    ('llm_eval_arena_comparisons', 'llm_evals_arena_comparisons'),
    ('llm_eval_models', 'llm_evals_models'),
    ('llm_eval_scorers', 'llm_evals_scorers'),
    ('llm_eval_datasets', 'llm_evals_datasets'),
    ('llm_eval_projects', 'llm_evals_projects'),
    ('llm_eval_org_members', 'llm_evals_org_members'),
    ('llm_eval_organizations', 'llm_evals_organizations'),
]

# Tables to drop (unused/deprecated)
TABLES_TO_DROP = [
    'eval_model_preferences',
    'deepeval_model_preferences',
]


def upgrade() -> None:
    """Rename all llm_eval_* tables to llm_evals_* prefix."""
    schemas = _discover_tenant_schemas(op, sa)
    conn = op.get_bind()
    
    for schema_name in schemas:
        print(f"Renaming tables in schema: {schema_name}")
        
        for old_name, new_name in TABLE_RENAMES:
            # Check if old table exists
            result = conn.execute(sa.text(f'''
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = :schema_name 
                    AND table_name = :table_name
                );
            '''), {"schema_name": schema_name, "table_name": old_name})
            old_exists = result.scalar()
            
            # Check if new table already exists (idempotency)
            result = conn.execute(sa.text(f'''
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = :schema_name 
                    AND table_name = :table_name
                );
            '''), {"schema_name": schema_name, "table_name": new_name})
            new_exists = result.scalar()
            
            if old_exists and not new_exists:
                print(f"  Renaming {old_name} -> {new_name}")
                op.execute(sa.text(f'ALTER TABLE "{schema_name}"."{old_name}" RENAME TO "{new_name}";'))
            elif new_exists:
                print(f"  ⏭ {new_name} already exists, skipping")
            else:
                print(f"  ⏭ {old_name} does not exist, skipping")
        
        # Also rename indexes
        print(f"  Renaming indexes in {schema_name}...")
        
        result = conn.execute(sa.text(f'''
            SELECT indexname 
            FROM pg_indexes 
            WHERE schemaname = :schema_name
            AND indexname LIKE 'idx_llm_eval_%'
        '''), {"schema_name": schema_name})
        
        for row in result.fetchall():
            old_index_name = row[0]
            new_index_name = old_index_name.replace('idx_llm_eval_', 'idx_llm_evals_', 1)
            
            if new_index_name != old_index_name:
                # Check if new index already exists
                check_result = conn.execute(sa.text(f'''
                    SELECT EXISTS (
                        SELECT FROM pg_indexes 
                        WHERE schemaname = :schema_name
                        AND indexname = :index_name
                    );
                '''), {"schema_name": schema_name, "index_name": new_index_name})
                
                if not check_result.scalar():
                    print(f"    Renaming index {old_index_name} -> {new_index_name}")
                    op.execute(sa.text(f'ALTER INDEX "{schema_name}"."{old_index_name}" RENAME TO "{new_index_name}";'))
        
        # Drop unused/deprecated tables
        for table_name in TABLES_TO_DROP:
            result = conn.execute(sa.text(f'''
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = :schema_name 
                    AND table_name = :table_name
                );
            '''), {"schema_name": schema_name, "table_name": table_name})
            
            if result.scalar():
                print(f"  Dropping deprecated table: {table_name}")
                op.execute(sa.text(f'DROP TABLE IF EXISTS "{schema_name}"."{table_name}" CASCADE;'))
        
        print(f"  ✓ Completed renaming in {schema_name}")


def downgrade() -> None:
    """Revert table names back to llm_eval_*."""
    schemas = _discover_tenant_schemas(op, sa)
    conn = op.get_bind()
    
    # Reverse the order for downgrade
    reversed_renames = list(reversed(TABLE_RENAMES))
    
    for schema_name in schemas:
        print(f"Reverting table names in schema: {schema_name}")
        
        for old_name, new_name in reversed_renames:
            result = conn.execute(sa.text(f'''
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = :schema_name 
                    AND table_name = :table_name
                );
            '''), {"schema_name": schema_name, "table_name": new_name})
            new_exists = result.scalar()
            
            if new_exists:
                print(f"  Renaming {new_name} -> {old_name}")
                op.execute(sa.text(f'ALTER TABLE "{schema_name}"."{new_name}" RENAME TO "{old_name}";'))
