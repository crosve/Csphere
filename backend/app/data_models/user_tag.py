from sqlalchemy import Column, String, TIMESTAMP, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.data_models.tag import Tag
import uuid

from app.db.database import Base


# class UserTag(Base):
#     __tablename__ = 'user_tag'

#     # Use a composite primary key to prevent duplicate user-tag pairs
#     user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
#     tag_id = Column(UUID(as_uuid=True), ForeignKey("tag.tag_id", ondelete="CASCADE"), primary_key=True)

#     first_created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

#     user = relationship("User", back_populates="user_tags")
#     tag = relationship("Tag", back_populates="tagged_users")

