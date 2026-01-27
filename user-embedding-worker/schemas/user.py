from pydantic import BaseModel, Field, HttpUrl
from datetime import datetime
from typing import Optional
from pgvector.sqlalchemy import Vector




class UserEmbeddingData(BaseModel):
    user_id: str
    user_embedding: list[float]
    last_update: datetime
