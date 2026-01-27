from sqlalchemy import Column, String, TIMESTAMP, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy import text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.data_models.content_category import ContentCategory
# from app.data_models.content import Content


from app.db.database import Base
import uuid


class Category(Base):
    __tablename__='category'

    category_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category_name = Column(String, unique=True, nullable=True, default='')
    created_at = Column(TIMESTAMP(timezone=True), default=func.now())
    date_modified = Column(TIMESTAMP(timezone=True), default=func.now())

    contents = relationship(
        "Content",                       
        secondary=ContentCategory,
        back_populates="categories"     
    )