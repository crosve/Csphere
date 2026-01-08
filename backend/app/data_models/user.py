from sqlalchemy import Column, String, TIMESTAMP
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, Mapped
from app.db.database import Base
from app.data_models.user_tag import UserTag
import uuid


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid)
    email = Column(String, unique=True, nullable=False)
    created_at = Column(TIMESTAMP, server_default="NOW()")
    username = Column(String,  nullable=False)
    password = Column(String, nullable=False)
    google_id = Column(String, nullable=True)
    profile_path = Column(String, default='')

    user_tags: Mapped[list["UserTag"]] = relationship("UserTag", back_populates="user")



# class UserCreate(BaseModel):
#     email: EmailStr  # email field is validated as a proper email format
#     created_at: datetime = None  # Optional: you can default this to now on the server-side

#     class Config:
#         orm_mode = Trueimage.pngimage.png