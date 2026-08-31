"""Application settings, loaded from the environment / repo-root .env.

Every field has a default, so a misresolved env file fails *silently* with a
default config. Two guards against that: `env_file` is an absolute path anchored
to this file (not cwd-relative), and `_guard` rejects the placeholder JWT secret
outside development.
"""

from pathlib import Path

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_REPO_ROOT = Path(__file__).resolve().parent.parent
_PLACEHOLDER_JWT_SECRET = "dev-secret-change-me-not-for-production-use"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_REPO_ROOT / ".env",
        extra="ignore",
    )

    # ---- Database ----
    # App + test suite connect as the non-superuser `tuklas_app` role so Postgres
    # RLS actually applies (superusers bypass it unconditionally). Alembic uses
    # `migration_database_url` (a superuser) for DDL + CREATE ROLE.
    database_url: str = "postgresql+asyncpg://tuklas_app:tuklas_app@localhost:5432/tuklas"
    migration_database_url: str = "postgresql+asyncpg://tuklas:tuklas@localhost:5432/tuklas"
    test_database_url: str = "postgresql+asyncpg://tuklas_app:tuklas_app@localhost:5432/tuklas_test"

    # ---- Queue ----
    redis_url: str = "redis://localhost:6379/0"

    # ---- Auth ----
    jwt_secret: str = _PLACEHOLDER_JWT_SECRET
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440
    bcrypt_rounds: int = 12

    # ---- App ----
    environment: str = "development"
    api_prefix: str = ""
    # Comma-separated; pydantic-settings would parse a JSON list for `list[str]`,
    # so keep it a plain string and split in `cors_origin_list`.
    cors_origins: str = "http://localhost:3000"

    # ---- LLM (Phase 1: local Ollama) ----
    ollama_host: str = "http://localhost:11434"
    anthropic_api_key: str | None = None

    # ---- Crawler ----
    crawler_user_agent: str = "TuklasBot/0.1 (+https://example.com/bot)"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @model_validator(mode="after")
    def _guard(self) -> "Settings":
        if self.environment != "development" and self.jwt_secret == _PLACEHOLDER_JWT_SECRET:
            raise ValueError(
                f"JWT_SECRET is still the placeholder with ENVIRONMENT={self.environment!r}. "
                "Set a real JWT_SECRET."
            )
        return self


settings = Settings()
