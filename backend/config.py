"""Application settings, loaded from the environment / .env.

TODO (Milestone 1): expand as features land. Keep secrets out of source.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+asyncpg://tuklas:tuklas@localhost:5432/tuklas"
    redis_url: str = "redis://localhost:6379/0"

    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440

    ollama_host: str = "http://localhost:11434"
    anthropic_api_key: str | None = None

    crawler_user_agent: str = "TuklasBot/0.1 (+https://example.com/bot)"


settings = Settings()
