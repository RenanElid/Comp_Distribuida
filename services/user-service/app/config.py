from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")

    database_url: str
    jwt_secret: str
    jwt_expiracao_minutos: int = 60
    frontend_url: str = "http://localhost:3000"


settings = Settings()
