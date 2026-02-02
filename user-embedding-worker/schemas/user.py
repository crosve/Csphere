from pydantic import BaseModel,ConfigDict
from datetime import datetime
from typing import Optional, List
from pgvector.sqlalchemy import Vector
from uuid import UUID





class UserEmbeddingData(BaseModel):
    # Allow Pydantic to work with SQLAlchemy objects if needed
    model_config = ConfigDict(from_attributes=True)

    user_id: UUID
    # Make this Optional or provide a default factory
    user_embedding: Optional[List[float]] = None
    last_update: Optional[datetime] = None