from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://letdoc:letdoc@db:5432/letdoc"
    groq_api_key: str = ""
    deepgram_api_key: str = ""
    cors_origins: str = "http://localhost:3000"

    class Config:
        env_file = ".env"

settings = Settings()