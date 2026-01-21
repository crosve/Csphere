from sqlalchemy import Column, String, TIMESTAMP
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, Mapped
from app.db.database import Base
import uuid

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False)
    created_at = Column(TIMESTAMP, server_default="NOW()")
    username = Column(String,  nullable=False)
    password = Column(String, nullable=False)
    google_id = Column(String, nullable=True)
    profile_path = Column(String, default='')

    # Updated relationship: Point directly to Tag
    # back_populates should match the attribute name in your Tag model (e.g., 'owner')
    user_tags: Mapped[list["Tag"]] = relationship("Tag", back_populates="owner", cascade="all, delete-orphan")


# class UserCreate(BaseModel):
#     email: EmailStr  # email field is validated as a proper email format
#     created_at: datetime = None  # Optional: you can default this to now on the server-side

#     class Config:
#         orm_mode = Trueimage.pngimage.png