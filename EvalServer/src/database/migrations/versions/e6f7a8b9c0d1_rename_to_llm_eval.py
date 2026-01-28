"""rename-tables-to-llm_evals

Revision ID: e6f7a8b9c0d1
Revises: c4d5e6f7a8b9
Create Date: 2026-01-19

Renames all eval-related tables from deepeval_* / experiments / evaluation_* to llm_evals_* prefix
for consistent naming convention.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from database.migrations.util import _discover_tenant_schemas


# revision identifiers, used by Alembic.
revision: str = 'e6f7a8b9c0d1'
down_revision: Union[str, None] = 'c4d5e6f7a8b9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Table renames: old_name -> new_name
TABLE_RENAMES = [
    # Must rename in order due to foreign key dependencies
    # First rename tables that have no dependents, then work up the chain
    ('evaluation_metrics', 'llm_evals_metrics'),
    ('evaluation_logs', 'llm_evals_logs'),
    ('experiments', 'llm_evals_experiments'),
    ('evaluation_llm_api_keys', 'llm_evals_api_keys'),
    ('deepeval_arena_comparisons', 'llm_evals_arena_comparisons'),
    ('deepeval_models', 'llm_evals_models'),
    ('deepeval_scorers', 'llm_evals_scorers'),
    ('deepeval_user_datasets', 'llm_evals_datasets'),
    ('deepeval_projects', 'llm_evals_projects'),
    ('deepeval_org_members', 'llm_evals_org_members'),
    ('deepeval_organizations', 'llm_evals_organizations'),
]


def upgrade() -> None:
    """Rename all eval tables to llm_evals_* prefix."""
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
        
        # Also rename indexes to match new table names
        print(f"  Renaming indexes in {schema_name}...")
        
        # Get all indexes in this schema that start with old prefixes
        result = conn.execute(sa.text(f'''
            SELECT indexname 
            FROM pg_indexes 
            WHERE schemaname = :schema_name
            AND (indexname LIKE 'idx_deepeval_%' 
                 OR indexname LIKE 'idx_evaluation_%' 
                 OR indexname LIKE 'idx_experiments_%')
        '''), {"schema_name": schema_name})
        
        for row in result.fetchall():
            old_index_name = row[0]
            new_index_name = old_index_name
            
            # Replace prefixes
            if old_index_name.startswith('idx_deepeval_'):
                new_index_name = old_index_name.replace('idx_deepeval_', 'idx_llm_evals_', 1)
            elif old_index_name.startswith('idx_evaluation_'):
                new_index_name = old_index_name.replace('idx_evaluation_', 'idx_llm_evals_', 1)
            elif old_index_name.startswith('idx_experiments_'):
                new_index_name = old_index_name.replace('idx_experiments_', 'idx_llm_evals_experiments_', 1)
            
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
        
        print(f"  ✓ Completed renaming in {schema_name}")


def downgrade() -> None:
    """Revert table names back to original."""
    schemas = _discover_tenant_schemas(op, sa)
    conn = op.get_bind()
    
    # Reverse the order for downgrade
    reversed_renames = list(reversed(TABLE_RENAMES))
    
    for schema_name in schemas:
        print(f"Reverting table names in schema: {schema_name}")
        
        for old_name, new_name in reversed_renames:
            # Check if new table exists
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
