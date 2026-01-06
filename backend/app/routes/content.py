from fastapi import APIRouter, Depends, HTTPException, Query, status
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
from app.data_models.user import User
from datetime import datetime, timezone
import logging
from sqlalchemy.orm import joinedload
from dateutil.parser import isoparse

from app.utils.hashing import get_current_user_id
from app.utils.user import get_current_user
from app.utils.url import ensure_safe_url
from sqlalchemy.orm import Session
from uuid import UUID
from sqlalchemy import desc 

import requests 
import json 

from email.utils import quote

import os
from dotenv import load_dotenv

from app.services.content_services import search_content, _enqueue_new_content, get_total_unread_count, get_unread_content_service, get_content_service, update_note_service

from app.exceptions.content_exceptions import EmbeddingManagerNotFound, NoMatchedContent, NotesNotFound


router = APIRouter(
    # prefix="/content"
)

logger = logging.getLogger(__name__) 



@router.get("/content/search", response_model=UserSavedContentResponse, status_code=status.HTTP_200_OK)
def search(query: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):

    try:
        response_json = search_content(db=db, query=query, user=user )
        return response_json

    except EmbeddingManagerNotFound:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI search engine is currently offline or broken"
        )
    
    except NoMatchedContent:
        raise HTTPException(
            status_code=status.HTTP_204_NO_CONTENT,
            detail="No Matched content found for this search query"
        )
    except Exception as e:
        logging.error(f"Search for query {query} failed. Error is as follows: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Search is currently unavailable, please try again"
        )
  


@router.post("/content/save")
def save_content(content: ContentCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        _enqueue_new_content(
                url=content.url,
                title=content.title,
                source="chrome_extension",
                html=content.html,
                user_id=user.id,
                notes=content.notes,
                folder_id=content.folder_id,
            )

        return {"status": "Success", 'message': 'Bookmark details sent to message queue'}

    except Exception as e:
        logger.error(f"Error occurred in saving the bookmark: {str(e)}", exc_info=True)
        return {'status': "unsuccessful", 'error': "Failed to save bookmark from chrome extension"}


@router.post("/content/save/url")
def save_content_by_url(content: ContentSavedByUrl, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        safe_url = ensure_safe_url(content.url)

        html = ''

        title =safe_url    
        logging.info(f"safe url being set: {safe_url}")

        _enqueue_new_content(
            url=safe_url if safe_url else content.url,
            title=content.url, 
            source="web_app",
            html=None,
            user_id=user.id,
            notes=None,
            folder_id="default",
        )
        return {'status': "Success", 'message': 'Bookmark details sent to message queue'}
    
    except Exception as e:
        logger.error(f"Error occurred in saving the url: {str(e)}", exc_info=True)
        return {'status': "unsuccessful", 'error': "Failed to save bookmark from the provided url"}    

    

@router.get("/content/unread/count", status_code=status.HTTP_200_OK)
def get_unread_count(user_id: UUID = Depends(get_current_user_id), db: Session = Depends(get_db)):
    try:
        return get_total_unread_count(user_id=user_id, db=db)

    except Exception as e:
        logger.error(f"Error occured in count api router: {e}")
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to get the total count at this moment"
        )




@router.get("/content/unread", response_model=UserSavedContentResponse, status_code=status.HTTP_200_OK)
def get_unread_content(cursor: str = None, user_id: UUID = Depends(get_current_user_id), db: Session = Depends(get_db)):


    try:
        return get_unread_content_service(cursor=cursor, user_id=user_id, db=db)

    #catches the previous message we're bubbling up
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    except Exception as e:
        logging.error(f"failed to get unread content for user id {user_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Server error trying to fetch the unread content for the users unread content"
        )





@router.get("/content", response_model=UserSavedContentResponse)
def get_user_content(
    cursor: str = None,
    categories: list[str] = None, 
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    

    try:
        return get_content_service(cursor=cursor, user_id=user_id, db=db, categories=categories)
    
    except ValueError as e:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    
    except Exception as e:
        db.rollback()
        logging.error(f"Following error happened when fetching the content for user id {user_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail="Server side error trying to fetch the content for the user"
        )


    

@router.post("/content/update/notes")
def updatenote(data: NoteContentUpdate, user_id: UUID = Depends(get_current_user_id), db: Session = Depends(get_db)):


    try:
        return update_note_service(data=data, user_id=user_id, db=db)
    
    except NotesNotFound as e:
        db.rollback()
        logging.info("Notes for user was not found")
        raise HTTPException(status_code=404, detail=str(e))
    
    except Exception as e:
        db.rollback()

        logger.error(f"User notes failed to update: {e}")
        raise HTTPException(
            status_code=500,
            detail="A server side error occured when trying to update the users notes"
        )


@router.post("/content/tab")
def tab_user_content(content: TabRemover,user_id: UUID = Depends(get_current_user_id), db: Session = Depends(get_db)):

    try:
        content_id = content.content_id

        query = db.query(Content).filter(
            Content.content_id == content_id
        )

        DBcontent = query.one_or_none()

        if not DBContent:
            raise HTTPException(
            status_code=400,
            detail="Content not found in the Contents table"
        )


        existing_item = db.query(ContentItem).filter(
            ContentItem.user_id == user_id,
            ContentItem.content_id == DBcontent.content_id
        ).first()

        utc_time = datetime.now(timezone.utc)

        if not existing_item:
            new_item = ContentItem(
                user_id=user_id,
                content_id=DBcontent.content_id,
                saved_at=utc_time,  
                notes='' 
            )
            db.add(new_item)
            db.commit()

        return {'success' : True}
    
    except Exception as e:
        print("error in the backend: ", e)
        return {'success': False}


    





@router.post("/content/untab")
def untab_user_content(content: TabRemover,user_id: UUID = Depends(get_current_user_id), db: Session = Depends(get_db)):
    #remove based on user_id and content_id
    content_id_to_delete = content.content_id

    # Construct the query to find the specific ContentItem to delete
    query = db.query(ContentItem).filter(
        ContentItem.user_id == user_id,
        ContentItem.content_id == content_id_to_delete
    )


    deleted_row_count = query.delete(synchronize_session='fetch')

    if deleted_row_count == 0:
     
        raise HTTPException(
            status_code=400,
            detail="Content item not found for the specified user and content ID."
        )

    db.commit()

    return {
        "message": "Content item successfully untabbed (deleted).",
        "user_id": user_id,
        "content_id": content_id_to_delete,
        "deleted_count": deleted_row_count
    }



@router.delete("/content/{content_id}", status_code=204)
def delete_content(content_id: UUID, user_id: UUID, db: Session=Depends(get_db)):
    content = db.query(Content).filter(Content.content_id == content_id, Content.user_id == user_id).first()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found or not owned by user")

    db.delete(content)
    db.commit()
    return



@router.post("/user/content/{content_id}")
def update_read(content_id: UUID, user_id: UUID = Depends(get_current_user_id), db: Session = Depends(get_db)):
    content = db.query(ContentItem).filter(ContentItem.content_id == content_id, ContentItem.user_id == user_id).first()

    if not content:
        raise HTTPException(status_code=404, detail="Content not found or not owned by user")
    
    content.read = True
    db.commit()
    db.refresh(content)  # optional, but good practice if you'll return updated data

    return {"success": True}


@router.get("/content/{content_id}", response_model=ContentWithSummary)
def get_piece_content(content_id: UUID, user_id: UUID = Query(...), db: Session = Depends(get_db)):
    content = db.query(Content).filter(Content.content_id == content_id, Content.user_id == user_id).first()

    if not content:
        raise HTTPException(status_code=404, detail="Content not found for this user")
    return content


@router.post("/content/recent", response_model=list[ContentWithSummary])
def get_recent_content(user_id: UUID = Depends(get_current_user_id), db: Session = Depends(get_db)):
    try:
        results = (
            db.query(Content, Folder, ContentItem)
            .join(ContentAI, ContentAI.content_id == Content.content_id)
            .outerjoin(folder_item, folder_item.content_id == Content.content_id)
            .join(ContentItem, ContentItem.content_id == Content.content_id)
            .outerjoin(Folder, folder_item.folder_id == Folder.folder_id)
            .filter(ContentItem.user_id == user_id)
            .order_by(ContentItem.saved_at.desc())
            .limit(10)
            .all()
        )


        response = []
        for content, folder, _ in results:
            response.append(ContentWithSummary(
                content_id=content.content_id,
                title=content.title,
                url=content.url,
                source=content.source,
                first_saved_at=content.first_saved_at,
                ai_summary=content.content_ai.ai_summary if content.content_ai else None,
                folder = folder.folder_name if  folder and folder.folder_name else 'none'
            ))

        logger.info(f"Recent content for user id {user_id} being returned: {response}")

        return response

    except Exception as e:
        logger.error(f"Error occured in api endpoint '/content/recent' : {e}")
        return []  
