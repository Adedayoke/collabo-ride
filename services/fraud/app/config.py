"""Service environment, validated at boot. A missing or wrong value fails at start."""

from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: Literal["development", "production", "test"] = "development"
    service_name: str
    port: int = Field(gt=0)
    log_level: Literal["debug", "info", "warn", "error"] = "info"
    gateway_context_key: str = Field(min_length=32)
    database_url: str
    valkey_durable_url: str
