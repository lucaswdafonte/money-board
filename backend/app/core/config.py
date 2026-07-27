from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: str = "development"

    database_url: str = "postgresql+psycopg://money_board:money_board@db:5432/money_board"
    redis_url: str = "redis://redis:6379/0"

    secret_key: str = "dev-secret-key-change-in-production"
    access_token_expire_minutes: int = 60

    cors_origins: list[str] = ["http://localhost:5173"]


settings = Settings()
