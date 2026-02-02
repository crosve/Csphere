from sqlalchemy import Column, ForeignKey, TIMESTAMP, String, Boolean, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database.database import Base
from data_models.content_tag import ContentTag


class ContentItem(Base):
    __tablename__ = "content_item"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    content_id = Column(UUID(as_uuid=True), ForeignKey("content.content_id"), primary_key=True)
    saved_at = Column(TIMESTAMP(timezone=True), default=func.now())
    notes = Column(String, nullable=True)
    content = relationship("Content", backref="content_items")
    read = Column(Boolean, nullable=False, server_default=text('false'))

    tags = relationship(
        'Tag',
        secondary=ContentTag, 
        back_populates="contents"
    )



# class ContentItem(Base):
#     __tablename__ = "content_item"
    
#     item_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
#     user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
#     content_id = Column(UUID(as_uuid=True), ForeignKey("content.content_id"))
#     saved_at = Column(TIMESTAMP(timezone=True), server_default=text("NOW()"))
