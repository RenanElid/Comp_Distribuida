from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")

    database_url: str
    jwt_secret: str
    alunos_service_url: str = "http://localhost:8003"
    administrativo_service_url: str = "http://localhost:8002"
    kafka_bootstrap_servers: str | None = None

settings = Settings()
