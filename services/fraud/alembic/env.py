"""Runs fraud's migrations under the fraud role, in the fraud schema (spec 0009, Migrations)."""

from logging.config import fileConfig

from sqlalchemy import create_engine

from alembic import context
from app.config import Settings

SCHEMA = "fraud"

if context.config.config_file_name is not None:
    fileConfig(context.config.config_file_name)


def sqlalchemy_url(database_url: str) -> str:
    """DATABASE_URL is a plain postgres:// URL; SQLAlchemy needs the psycopg dialect named."""
    for prefix in ("postgresql://", "postgres://"):
        if database_url.startswith(prefix):
            return "postgresql+psycopg://" + database_url.removeprefix(prefix)
    return database_url


def run_migrations() -> None:
    engine = create_engine(sqlalchemy_url(Settings().database_url))  # type: ignore[call-arg]
    with engine.connect() as connection:
        context.configure(connection=connection, version_table_schema=SCHEMA)
        with context.begin_transaction():
            context.run_migrations()


run_migrations()
