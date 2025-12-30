from sqlalchemy import Column, String, TIMESTAMP, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID
from database import Base
from datetime import datetime
import uuid

from pgvector.sqlalchemy import Vector

from sqlalchemy.orm import Mapped, mapped_column

from sqlalchemy.dialects.postgresql import ARRAY



class Folder(Base):
    __tablename__ = "folder"


    folder_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id",  ondelete="CASCADE"), nullable=False)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("folder.folder_id",  ondelete="CASCADE"), nullable=False)
    folder_name = Column(String, nullable=False)
    bucketing_mode : Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    keywords : Mapped[list[str]] = mapped_column(ARRAY(String))
    url_patterns : Mapped[list[str]] = mapped_column(ARRAY(String))
    description : Mapped[str] = mapped_column(String)
    folder_embedding = Column(Vector(1536), nullable=True) #1536 for the gpt model param (small model)
    created_at = Column(TIMESTAMP, server_default="NOW()")






