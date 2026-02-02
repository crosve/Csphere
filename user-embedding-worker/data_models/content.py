from sqlalchemy import Column, String, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from database.database import Base
import uuid
from data_models.content_category import ContentCategory
from data_models.category import Category


class Content(Base):
    __tablename__ = "content"

    content_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    url = Column(String, unique=True, nullable=False)   
    title = Column(String, nullable=True)
    source = Column(String, nullable=True)
    first_saved_at = Column(TIMESTAMP(timezone=True), default=func.now())
    content_ai = relationship("ContentAI", backref="content", uselist=False)


    categories = relationship(
        "Category",                      
        secondary=ContentCategory,
        back_populates="contents"      
    )

