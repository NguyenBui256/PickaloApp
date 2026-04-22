"""
Alembic environment configuration.

Configures the migration environment with async database support.
"""

import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

# Import your Base and models here
from app.core.config import settings
from app.core.database import Base

# Import all models so they are registered with SQLAlchemy
from app.models import (
    User,
    Venue,
    PricingTimeSlot,
    VenueService,
    Booking,
    BookingSlot,
    BookingService,
    Court,
    Post,
    Comment,
    AdminAction,
    VenueReview,
)

# Alembic Config object
config = context.config

# Override database URL from environment
config.set_main_option("sqlalchemy.url", settings.database_url.replace(
    "postgresql://", "postgresql+asyncpg://"
))

# Interpret the config file for Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Target metadata for autogenerate support
target_metadata = Base.metadata


def include_object(object, name, type_, reflected, compare_to):
    """
    Exclude PostGIS and Tiger Geocoder system tables from migrations.
    """
    if type_ == "table" and reflected:
        # List of PostGIS/Tiger system tables to exclude
        exclude_tables = [
            "spatial_ref_sys", "topology", "layer", "loader_platform",
            "loader_variables", "loader_lookuptables", "zip_lookup",
            "zip_lookup_base", "zip_lookup_all", "geocode_settings",
            "geocode_settings_default", "pagc_lex", "pagc_rules",
            "pagc_gaz", "tabblock", "tabblock20", "zip_state",
            "zip_state_loc", "state", "county", "tract", "bg",
            "faces", "edges", "addr", "addrfeat", "place", "cousub",
            "zcta5", "featnames", "place_lookup", "county_lookup",
            "secondary_unit_lookup", "street_type_lookup",
            "state_lookup", "direction_lookup", "countysub_lookup"
        ]
        if name in exclude_tables:
            return False
    return True


def run_migrations_offline() -> None:
    """
    Run migrations in 'offline' mode.

    This configures the context with just a URL and not an Engine,
    though an Engine is acceptable here as well.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        include_object=include_object,
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    """Run migrations with the given connection."""
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
        include_object=include_object,
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Run migrations in async mode."""
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
