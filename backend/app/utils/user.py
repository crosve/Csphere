from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from app.db.database import get_db
from app.utils.hashing import get_current_user_id
from app.data_models.user import User

def get_current_user(user_id: UUID = Depends(get_current_user_id), db: Session = Depends(get_db)) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=400, detail="User not found")
    return user