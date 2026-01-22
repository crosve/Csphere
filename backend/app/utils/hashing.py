from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status
from typing import Annotated
from uuid import UUID
from jwt import exceptions as jwt_exceptions

from app.core.settings import Settings

from pydantic import BaseModel

from dotenv import load_dotenv
from pathlib import Path
import os
import jwt


settings = Settings()

SECRET_KEY = settings.SECRET_KEY
print("Secret key from .env within hashing file:", SECRET_KEY)

if isinstance(SECRET_KEY, str):
    print("Secret key loaded successfully")

else:
    print("Secret key not loaded. Please check your .env file.")


ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: str | None = None


class User(BaseModel):
    username: str
    email: str | None = None
    full_name: str | None = None
    disabled: bool | None = None


class UserInDB(User):
    hashed_password: str


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")



def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta=None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    if "sub" not in to_encode:
        raise ValueError("Token data must include 'sub' key for username")
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise KeyError("sub")
        token_data = TokenData(username=username)
    except KeyError:
        return None
    return token_data


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
    

  
    
