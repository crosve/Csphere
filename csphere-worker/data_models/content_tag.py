
from sqlalchemy import Column, ForeignKey, Table, ForeignKeyConstraint

from sqlalchemy.dialects.postgresql import UUID


from database import Base



ContentTag = Table(
    "content_tag",
    Base.metadata,
    Column("content_id", UUID(as_uuid=True), primary_key=True),
    Column("user_id", UUID(as_uuid=True), primary_key=True),
    Column("tag_id", UUID(as_uuid=True), ForeignKey("tag.tag_id"), primary_key=True),
    
    ForeignKeyConstraint(
        ["content_id", "user_id"], 
        ["content_item.content_id", "content_item.user_id"]
    )
)