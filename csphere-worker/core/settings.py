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
    OPENAI_API_KEY: str
    OPENROUTER_API_KEY: str

    DATABASE_URL: str

    ACTIVEMQ_URL: str
    ACTIVEMQ_QUEUE: str
    ACTIVEMQ_USER: str
    ACTIVEMQ_PASS: str

    
    AWS_ACCESS_KEY: str
    AWS_SECRET_KEY: str
    BUCKET_NAME: str







@lru_cache()
def get_settings() -> Settings:
    return Settings()
