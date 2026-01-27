from sqlalchemy import Column, ForeignKey, Table

from sqlalchemy.dialects.postgresql import UUID


from app.db.database import Base



ContentCategory = Table(
    "content_category",
    Base.metadata,
    Column("content_id", UUID(as_uuid=True), ForeignKey("content.content_id"), primary_key=True),
    Column("category_id", UUID(as_uuid=True), ForeignKey("category.category_id"), primary_key=True),
)