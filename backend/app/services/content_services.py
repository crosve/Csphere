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

from app.exceptions.content_exceptions import EmbeddingManagerNotFound, NoMatchedContent, ContentItemNotFound, NotesNotFound

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
    




def push_to_activemq(message: str):
    ACTIVEMQ_URL=os.getenv('ACTIVEMQ_URL')
    ACTIVEMQ_QUEUE= os.getenv('ACTIVEMQ_QUEUE')
    ACTIVEMQ_USER= os.getenv('ACTIVEMQ_USER')
    ACTIVEMQ_PASS= os.getenv('ACTIVEMQ_PASS')

    try:
        url = f"{ACTIVEMQ_URL}/api/message/{quote(ACTIVEMQ_QUEUE)}?type=queue"
        headers = {'Content-Type': 'text/plain'}

        response = requests.post(url, data=message, headers=headers, auth=(ACTIVEMQ_USER, ACTIVEMQ_PASS))

        logging.debug(f"Response from ActiveMQ: {response.status_code} - {response.text}")
        return response.status_code == 200
    
    except requests.exceptions.RequestException as e:
        logging.error(f"Error pushing to ActiveMQ: {e}")
        return False


def _enqueue_new_content(
    *,
    url: str,
    title: str | None,
    source: str,
    html: str | None,
    user_id: UUID,
    notes: str | None,
    folder_id: str | UUID | None,
) -> None:
    utc_time = datetime.now(timezone.utc)
    payload = {
        "content_payload": {
            "url": url,
            "title": title,
            "source": source,
            "first_saved_at": utc_time.isoformat(),
        },
        "raw_html": html,
        "user_id": str(user_id),
        "notes": notes,
        "folder_id": str(folder_id) if folder_id else None,
    }
    message = json.dumps(payload)
    result = push_to_activemq(message=message)
    if not result:
        raise HTTPException(status_code=503, detail="Failed to push to ActiveMQ")
    



def get_total_unread_count(user_id: str, db: Session):
    total_count = db.query(ContentItem).filter(ContentItem.user_id == user_id, ContentItem.read == False).count()

    logger.debug(f"Total count fetched for user id {user_id} : {total_count}")
    return {'status' : "succesful", 'total_count' : total_count}


def get_content_service(cursor: str, categories: list[str], user_id : UUID, db: Session):

    PAGE_SIZE = 9

    if categories:
        categories = set(categories)

    # Parse cursor into datetime if provided

    #note: adding in another param - filters of categories we need to fetch 
    cursor_dt = None
    if cursor:
        try:
            cursor_dt = isoparse(cursor)
        except (ValueError, TypeError):
            raise ValueError("Datetime for cursor is wrongly formatted")

    # Base query
    query = (
        db.query(ContentItem, Content, ContentAI.ai_summary)
        .join(Content, ContentItem.content_id == Content.content_id)
        .outerjoin(ContentAI, Content.content_id == ContentAI.content_id)
        .options(joinedload(Content.categories))
        .filter(ContentItem.user_id == user_id)
    )

    if cursor_dt:
        query = query.filter(ContentItem.saved_at < cursor_dt)

    

    query = query.order_by(desc(ContentItem.saved_at)).limit(PAGE_SIZE + 1)

    results = query.all()

    # Check if we have more results
    has_next = len(results) > PAGE_SIZE
    results = results[:PAGE_SIZE]

    category_list = []
    bookmark_data = []

    for item, content, ai_summary in results:
        tags = [CategoryOut.from_orm(cat) for cat in content.categories]

        #calculate the intersection between the two 
        
        if categories:
            common_tags = set(tags).intersection(categories)


            if len(common_tags) >= 1:
                bookmark_data.append(
                    UserSavedContent(
                        content_id=content.content_id,
                        url=content.url,
                        title=content.title,
                        source=content.source,
                        ai_summary=ai_summary,
                        first_saved_at=item.saved_at,
                        notes=item.notes,
                        tags=tags
                    )
                )
                category_list.extend(tags)

        #no categories being filteres - Just add them in 
        else:
            bookmark_data.append(
                UserSavedContent(
                    content_id=content.content_id,
                    url=content.url,
                    title=content.title,
                    source=content.source,
                    ai_summary=ai_summary,
                    first_saved_at=item.saved_at,
                    notes=item.notes,
                    tags=tags
                )
            )
            category_list.extend(tags)

        

    unique_categories = {cat.category_id: cat for cat in category_list}.values()

    # The new cursor = last item’s saved_at
    next_cursor = bookmark_data[-1].first_saved_at.isoformat() if bookmark_data else None

    return {
        "bookmarks": bookmark_data,
        "categories": list(unique_categories)[:10],
        "next_cursor": next_cursor,
        "has_next": has_next
    }

def get_unread_content_service(cursor: str, user_id: UUID, db: Session):
    PAGE_SIZE = 9
    cursor_dt = None
    
    if cursor:
        try:
            cursor_dt = isoparse(cursor)
        except (ValueError, TypeError):
            raise ValueError("Invalid cursor format")

    # 1. Build the base query
    query = (
        db.query(ContentItem, Content, ContentAI.ai_summary)
        .join(Content, ContentItem.content_id == Content.content_id)
        .outerjoin(ContentAI, Content.content_id == ContentAI.content_id)
        .options(joinedload(Content.categories))
        .filter(ContentItem.user_id == user_id, ContentItem.read == False)
    )

    # 2. IMPORTANT: Re-assign the filtered query
    if cursor_dt:
        query = query.filter(ContentItem.saved_at < cursor_dt)

    # 3. Order and Limit (fetch PAGE_SIZE + 1 to check for has_next)
    results = query.order_by(desc(ContentItem.saved_at)).limit(PAGE_SIZE + 1).all()

    has_next = len(results) > PAGE_SIZE
    paged_results = results[:PAGE_SIZE]

    bookmark_data = []
    category_map = {}

    for item, content, ai_summary in paged_results:
        # Map categories and build unique list simultaneously
        tags = []
        for cat in content.categories:
            tag = CategoryOut.from_orm(cat)
            tags.append(tag)
            category_map[tag.category_id] = tag

        bookmark_data.append(
            UserSavedContent(
                content_id=content.content_id,
                url=content.url,
                title=content.title,
                source=content.source,
                ai_summary=ai_summary,
                first_saved_at=item.saved_at,
                notes=item.notes,
                tags=tags
            )
        )

    # Calculate next_cursor based on the last item in our paged results
    next_cursor = bookmark_data[-1].first_saved_at.isoformat() if bookmark_data else None

    return {
        "bookmarks": bookmark_data,
        "categories": list(category_map.values())[:10],
        "next_cursor": next_cursor,
        "has_next": has_next
    }



def update_note_service(*, data: NoteContentUpdate, user_id: UUID , db: Session):

    previous_note = db.query(ContentItem).filter(ContentItem.content_id == data.bookmarkID, ContentItem.user_id==user_id).first()

    if not previous_note:
        raise NotesNotFound(content_id=data.bookmarkID)
        # raise HTTPException(status_code=404, detail="Content item not found")

    previous_note.notes = data.notes
    db.commit()

    return {"message": "Note updated successfully", "bookmarkID": str(data.bookmarkID)}




