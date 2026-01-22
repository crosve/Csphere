from pydantic_settings import BaseSettings
from pydantic_settings import SettingsConfigDict
from functools import lru_cache

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8", 
        case_sensitive=False, 
        extra="ignore"
    )
    
    DATABASE_URL: str
    
    SECRET_KEY: str

    AWS_ACCESS_KEY: str
    AWS_SECRET_KEY: str
    BUCKET_NAME: str

    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    GOOGLE_REDIRECT_URI: str

    OPENAI_API_KEY: str
    OPENROUTER_API_KEY: str

    ACTIVEMQ_URL: str
    ACTIVEMQ_QUEUE: str
    ACTIVEMQ_USER: str
    ACTIVEMQ_PASS: str


@lru_cache()
def get_settings() -> Settings:
    return Settings()
