from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://letdoc:letdoc@db:5432/letdoc"
    groq_api_key: str = ""
    groq_model: str = "qwen/qwen3.6-27b"
    deepgram_api_key: str = ""
    cors_origins: str = "http://localhost:3000"
    ilovepdf_public_key: str = ""
    ilovepdf_secret_key: str = ""

    class Config:
        env_file = ".env"


settings = Settings()