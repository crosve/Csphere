from sqlalchemy import Column, String, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.db.database import Base
import uuid
from app.data_models.content_category import ContentCategory
from app.data_models.category import Category



class Tag(Base):
    __tablename__ = "tag"

    tag_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tag_name = Column(String, unique=True, nullable=False) 
    first_created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    
    tagged_users = relationship("UserTag", back_populates="tag")

    # categories = relationship(
    #     "Category",                      
    #     secondary=ContentCategory,
    #     back_populates="contents"      
    # )