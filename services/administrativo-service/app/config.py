from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")

    database_url: str
    jwt_secret: str
    user_service_url: str = "http://localhost:8001"
    kafka_bootstrap_servers: str | None = None

settings = Settings()
