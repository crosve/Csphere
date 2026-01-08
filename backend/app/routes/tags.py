from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.dependencies import get_current_user_id
from app.data_models.folder import Folder
from app.data_models.folder_item import folder_item
from sqlalchemy import desc, func, delete
from app.data_models.content import Content
from app.data_models.content_item import ContentItem
from app.data_models.content_ai import ContentAI

from app.services.tag_services import create_tag_service, get_user_tags_service
from app.schemas.tag import TagCreationData
from app.db.database import get_db
from app.exceptions.tag_exceptions import TagAlreadyExists

from app.utils.hashing import get_current_user_id
from datetime import datetime
from uuid import uuid4
from uuid import UUID
import logging



router = APIRouter()

logger = logging.getLogger(__name__) 


@router.post('/tag', status_code=200)
def create_tag(tag_data: TagCreationData   , user_id: UUID=Depends(get_current_user_id), db:Session = Depends(get_db)):

    try:
        print("tag data; ", tag_data)
        return create_tag_service(tag_data=tag_data, db=db, user_id=user_id)
    

    except TagAlreadyExists:
        logging.warning('User already has tag saved')
        raise HTTPException(
            status_code=400
        )

    except Exception as e:
        logging.error(f"Failed to create a new tag for the user: {e}")
        raise HTTPException(
            status_code = 500,
            detail="Failed to create the tag for the user"
        )



@router.get('/tag', status_code=200)
def get_tags(user_id: UUID = Depends(get_current_user_id), db : Session = Depends(get_db)):
    try:
        return get_user_tags_service(user_id=user_id, db=db)
        
    except Exception as e: 
        logging.error(f"Failed to fetch user {user_id}'s tags: {e}")

