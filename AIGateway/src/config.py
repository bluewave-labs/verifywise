from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    ai_gateway_port: int = 8100
    internal_api_key: str = ""
    redis_url: str = "redis://localhost:6379/0"
    log_level: str = "INFO"

    class Config:
        env_file = ".env"


settings = Settings()
