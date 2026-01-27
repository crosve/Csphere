from sqlalchemy import Column, String, TIMESTAMP, ForeignKey
from sqlalchemy.orm import relationship, Mapped
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.db.database import Base
import uuid
from app.data_models.content_category import ContentCategory
from app.data_models.content_tag import ContentTag
from app.data_models.category import Category



class Tag(Base):
    __tablename__ = "tag"

    tag_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tag_name = Column(String, nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    first_created_at = Column(TIMESTAMP, server_default="NOW()")

    owner: Mapped["User"] = relationship("User", back_populates="user_tags")

    contents = relationship(
        "ContentItem",                       
        secondary=ContentTag,
        back_populates="tags"     
    )