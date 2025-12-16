from logging.config import fileConfig

import asyncio
from sqlalchemy import pool, text
from concurrent.futures import ThreadPoolExecutor
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
from database.db import Base
from database.config import settings
config = context.config
config.set_main_option(
    "sqlalchemy.url",
    settings.sqlalchemy_database_url
)

# The current head migration revision
CURRENT_HEAD = "20251215_cleanup"

# Old revisions that should be auto-migrated to current head
# These are revisions that no longer exist in the migration chain
LEGACY_REVISIONS = {
    "20251212_initial",  # Temporary consolidated migration that was removed
}

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
# from myapp import mymodel
# target_metadata = mymodel.Base.metadata
target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def auto_fix_legacy_revision(connection):
    """Auto-fix legacy alembic revisions to current head.
    
    This handles the case where migrations were consolidated and 
    teammates have old revision IDs in their database.
    """
    try:
        result = connection.execute(text("SELECT version_num FROM alembic_version"))
        versions = [row[0] for row in result.fetchall()]
        
        if not versions:
            # No versions - fresh database, nothing to fix
            return
        
        # Check if any version is a legacy revision
        legacy_found = any(v in LEGACY_REVISIONS for v in versions)
        
        if legacy_found or (len(versions) > 1):
            print(f"[Alembic Auto-Fix] Found legacy/multiple versions: {versions}")
            print(f"[Alembic Auto-Fix] Updating to consolidated head: {CURRENT_HEAD}")
            connection.execute(text("DELETE FROM alembic_version"))
            connection.execute(text(f"INSERT INTO alembic_version (version_num) VALUES ('{CURRENT_HEAD}')"))
            connection.commit()
            print("[Alembic Auto-Fix] ✅ Done")
    except Exception as e:
        # Table might not exist yet (fresh install) - that's fine
        if "alembic_version" not in str(e).lower():
            print(f"[Alembic Auto-Fix] Warning: {e}")

def do_run_migrations(connection):
    # Auto-fix legacy revisions before running migrations
    auto_fix_legacy_revision(connection)
    
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()

async def run_async_migrations():
    """In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()

def run_migrations_online():
    """Run migrations in 'online' mode."""
    try:
        asyncio.get_running_loop() # Triggers RuntimeError if no running event loop
        # Create a separate thread so we can block before returning
        with ThreadPoolExecutor(1) as pool:
            pool.submit(lambda: asyncio.run(run_async_migrations()))
    except RuntimeError:
        asyncio.run(run_async_migrations())

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
