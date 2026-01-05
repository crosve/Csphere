from fastapi import APIRouter, Depends, HTTPException, Query
from app.db.database import get_db
from app.data_models.content import Content
from app.data_models.content_item import ContentItem
from app.data_models.content_ai import ContentAI
from app.data_models.folder_item import folder_item
from app.data_models.folder import Folder
from app.schemas.content import ContentCreate, ContentSavedByUrl, ContentWithSummary, UserSavedContent, DBContent, TabRemover, NoteContentUpdate, UserSavedContentResponse, CategoryOut
from app.preprocessing.content_preprocessor import ContentPreprocessor
from app.preprocessing.query_preprocessor import QueryPreprocessor
from app.embeddings.embedding_manager import ContentEmbeddingManager
from app.deps.services import get_embedding_manager
from app.ai.categorizer import Categorizer
from app.data_models.user import User
from datetime import datetime, timezone
from uuid import uuid4
import logging
from sqlalchemy.orm import joinedload
from dateutil.parser import isoparse

from app.utils.hashing import get_current_user_id
from app.utils.user import get_current_user
from app.utils.url import ensure_safe_url
from sqlalchemy.orm import Session
from uuid import UUID
from sqlalchemy import desc, select 

import requests 
import json 

from email.utils import quote

import os
from dotenv import load_dotenv

from app.exceptions.content_exceptions import EmbeddingManagerNotFound, NoMatchedContent

import logging

logger = logging.getLogger(__name__)

def search_content(*, db : Session, query: str,user: User):

    manager = get_embedding_manager()

    if not manager:
        raise EmbeddingManagerNotFound()
    manager.db = db

    parsed_query = QueryPreprocessor().preprocess_query(query)

    results = manager.query_similar_content(
        query=parsed_query,
        user_id=user.id
    )

    bookmark_data = []

    for content_ai, content in results:
        bookmark_data.append(
            UserSavedContent(
                content_id=content_ai.content_id,
                title=content.title,
                url=content.url,
                source=content.source,
                first_saved_at=content.first_saved_at,
                ai_summary=content_ai.ai_summary,
                notes="", 
                tags=[]    
            )
        )

    logger.info(f"Data for search: {bookmark_data}")

    if len(bookmark_data) == 0:
        raise NoMatchedContent()
    return {
        "bookmarks": bookmark_data,
        "categories": [],  # or `None`, depending on how you define Optional
        "has_next" : False
    }
    