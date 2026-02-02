from sqlalchemy import Column, String, TIMESTAMP, ForeignKey, ForeignKeyConstraint
from sqlalchemy.dialects.postgresql import UUID
from database.database import Base
from pydantic import BaseModel, EmailStr
from datetime import datetime
import uuid



class folder_item(Base):
    __tablename__="folder_item"

    folder_item_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid)
    folder_id = Column(UUID(as_uuid=True), nullable=False)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    content_id = Column(UUID(as_uuid=True), nullable=False)
    added_at = Column(TIMESTAMP, server_default="NOW()")


    __table_args__ = (
        ForeignKeyConstraint(
            ['user_id', 'content_id'],
            ['content_item.user_id', 'content_item.content_id'],
            ondelete="CASCADE"
        ),
        ForeignKeyConstraint(
            ['folder_id'],
            ['folder.folder_id'],
            ondelete="CASCADE"
        ),
    )



