from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from pgvector.sqlalchemy import Vector
from database.database import Base


class ContentAI(Base):
    __tablename__ = "content_ai"

    content_id = Column(UUID(as_uuid=True), ForeignKey("content.content_id"), primary_key=True)
    ai_summary = Column(String, nullable=True)
    embedding = Column(Vector(1536), nullable=True)