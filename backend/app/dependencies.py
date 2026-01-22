
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status
from typing import Annotated
from uuid import UUID
from jwt import exceptions as jwt_exceptions


import jwt



import os
from dotenv import load_dotenv
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")



from pathlib import Path
from app.core.settings import get_settings
dotenv_path = Path(__file__).resolve().parent.parent / "app"/ "api" / ".env"
print("Loading .env file from:", dotenv_path)
load_dotenv(dotenv_path)

settings = get_settings()
SECRET_KEY = settings.SECRET_KEY
print("Secret key from .env within dependencies file:", SECRET_KEY)

if isinstance(SECRET_KEY, str):
    print("Secret key loaded successfully")

else:
    print("Secret key not loaded. Please check your .env file.")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 



def get_current_user_id(token: Annotated[str, Depends(oauth2_scheme)]) -> UUID:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        print("Decoded token payload:", payload)
        print("User ID extracted from token:", user_id)
        if user_id is None:
            raise credentials_exception
        # token_data = TokenData(username=username)
        return UUID(user_id)
    except jwt_exceptions.PyJWTError:
        print("error occured in get_current_user_id")
        raise credentials_exception