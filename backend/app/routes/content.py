# 1. Standard Library Imports
import logging
from uuid import UUID

# 2. Third-Party Imports (FastAPI, SQLAlchemy)
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

# 3. Database & Models (Internal Data Structure)
from app.db.database import get_db
from app.data_models.user import User
from app.data_models.content import Content
from app.data_models.content_item import ContentItem

# 4. Schemas (Pydantic / Request-Response shapes)
from app.schemas.content import (
    ContentCreate, 
    ContentSavedByUrl, 
    ContentWithSummary, 
    TabRemover, 
    NoteContentUpdate, 
    UserSavedContentResponse, 
    BookmarkImportRequest
)

# 5. Utilities & Security
from app.utils.hashing import get_current_user_id
from app.utils.user import get_current_user
from app.utils.url import ensure_safe_url

# 6. Service Layer (Business Logic)
from app.services.content_services import (
    search_content,
    get_total_unread_count,
    get_unread_content_service,
    get_content_service, 
    update_note_service, 
    tab_content, 
    untabContent,
    delete_content, 
    get_recent_saved_content, 
    import_browser_bookmarks_service,
    _enqueue_new_content,
    get_discover_content_service
)

# 7. Exceptions
from app.exceptions.content_exceptions import (
    EmbeddingManagerNotFound, 
    NoMatchedContent, 
    NotesNotFound, 
    ContentItemNotFound, 
    ContentNotFound
)

logger = logging.getLogger(__name__)


router = APIRouter(
    prefix="/content",
    tags=["content"],
)


# class UserSavedContentResponse(BaseModel):
#     bookmarks: list[UserSavedContent]
#     categories: Optional[list[CategoryOut] ] = []
#     next_cursor: Optional[str] = ''
#     has_next: Optional[bool] = False


@router.get("/search", response_model=UserSavedContentResponse, status_code=status.HTTP_200_OK)
def search(query: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):

    try:
        response_json = search_content(db=db, query=query, user=user )
        return response_json

    except EmbeddingManagerNotFound:
        logging.error("Embedding manager not found ")
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
        logger.error(f"Search for query {query} failed. Error is as follows: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Search is currently unavailable, please try again"
        )
  


@router.get("/rediscover", status_code=200)
def get_discover_content(user_id: UUID = Depends(get_current_user_id), db: Session = Depends(get_db)):
    try:
        return get_discover_content_service(user_id=user_id, db=db)

    except Exception as e:
        logging.error(f"An error occured trying to fetch the users content: {e}")

@router.post("/save")
def save_content(content: ContentCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        _enqueue_new_content(
                url=content.url,
                title=content.title,
                source="chrome_extension",
                html=content.html,
                user_id=user.id,
                notes=content.notes,
                tags=content.tags,
                folder_id=content.folder_id,
            )

        return {"status": "Success", 'message': 'Bookmark details sent to message queue'}

    except Exception as e:
        logger.error(f"Error occurred in saving the bookmark: {str(e)}", exc_info=True)
        return {'status': "unsuccessful", 'error': "Failed to save bookmark from chrome extension"}


@router.post("/save/url")
def save_content_by_url(content: ContentSavedByUrl, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        safe_url = ensure_safe_url(content.url)

        html = ''

        title =safe_url    
        logger.info(f"safe url being set: {safe_url}")

        _enqueue_new_content(
            url=str(safe_url) if safe_url else content.url,
            title=content.url, 
            source="web_app",
            html=None,
            user_id=user.id,
            notes=None,
            tags=None,
            folder_id="default",
        )
        return {'status': "Success", 'message': 'Bookmark details sent to message queue'}
    
    except Exception as e:
        logger.error(f"Error occurred in saving the url: {str(e)}", exc_info=True)
        return {'status': "unsuccessful", 'error': "Failed to save bookmark from the provided url"}    

    

@router.get("/unread/count", status_code=status.HTTP_200_OK)
def get_unread_count(user_id: UUID = Depends(get_current_user_id), db: Session = Depends(get_db)):
    try:
        return get_total_unread_count(user_id=user_id, db=db)

    except Exception as e:
        logger.error(f"Error occured in count api router: {e}")
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to get the total count at this moment"
        )




@router.get("/unread", response_model=UserSavedContentResponse, status_code=status.HTTP_200_OK)
def get_unread_content(cursor: str = None, user_id: UUID = Depends(get_current_user_id), db: Session = Depends(get_db)):


    try:
        return get_unread_content_service(cursor=cursor, filter_category_names=[], user_id=user_id, db=db)

    #catches the previous message we're bubbling up
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    except Exception as e:
        logging.error(f"failed to get unread content for user id {user_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Server error trying to fetch the unread content for the users unread content"
        )





@router.get("/", response_model=UserSavedContentResponse)
def get_user_content(
    cursor: str = None,
    categories: list[str] = None, 
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    

    try:
        return get_content_service(cursor=cursor, user_id=user_id, db=db, filter_category_names=categories)
    
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


    

@router.post("/update/notes")
def updatenote(data: NoteContentUpdate, user_id: UUID = Depends(get_current_user_id), db: Session = Depends(get_db)):


    try:
        return update_note_service(data=data, user_id=user_id, db=db)
    
    except NotesNotFound as e:
        db.rollback()
        logger.info("Notes for user was not found")
        raise HTTPException(status_code=404, detail=str(e))
    
    except Exception as e:
        db.rollback()
        logger.error(f"User notes failed to update: {e}")
        raise HTTPException(
            status_code=500,
            detail="A server side error occured when trying to update the users notes"
        )


@router.post("/tab", status_code=200)
def tab_user_content(content: TabRemover,user_id: UUID = Depends(get_current_user_id), db: Session = Depends(get_db)):

    try:
        return tab_content(content=content, user_id=user_id, db = db)
    
    except ContentItemNotFound as e:
        db.rollback()
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )

    except Exception as e:
        db.rollback()
        logger.error(f"error in the backend: {e}")
        raise HTTPException(
            status_code=500, 
            detail="An error occured when trying to tab the content for the user"

        )



@router.post("/untab", status_code=200)
def untab_user_content(content: TabRemover,user_id: UUID = Depends(get_current_user_id), db: Session = Depends(get_db)):
    try:
        return untabContent(content=content, user_id=user_id, db=db)

    except ContentItemNotFound as e:
        logger.error(f"Content item could not be untabbed because it was not found: {e}")
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


    except Exception as e:
        db.rollback()
        logger.error(f"Error occured trying to untab for user {user_id}: {e}")

        raise HTTPException(
            status_code=500,
            detail="An error occured when trying to untab the users content. Try again in a little bit. "
        )

        


@router.delete("/{content_id}", status_code=204)
def delete_content(content_id: UUID, user_id: UUID = Depends(get_current_user_id), db: Session=Depends(get_db)):

    try:
        return delete_content(content_id=content_id, user_id=user_id, db=db)

    except Exception as e:
        logger.error(f"Failed to delete content: {e}")
        db.rollback()
        HTTPException(
            status_code=500,
            detail="Failed to delete content. Please try again."
        )



@router.post("/read/{content_id}")
def update_read(content_id: UUID, user_id: UUID = Depends(get_current_user_id), db: Session = Depends(get_db)):
    content = db.query(ContentItem).filter(ContentItem.content_id == content_id, ContentItem.user_id == user_id).first()

    if not content:
        raise HTTPException(status_code=404, detail="Content not found or not owned by user")
    
    content.read = True
    db.commit()
    db.refresh(content)  # optional, but good practice if you'll return updated data

    return {"success": True}


@router.get("/{content_id}", response_model=ContentWithSummary)
def get_piece_content(content_id: UUID, user_id: UUID = Query(...), db: Session = Depends(get_db)):
    content = db.query(Content).filter(Content.content_id == content_id, Content.user_id == user_id).first()

    if not content:
        raise HTTPException(status_code=404, detail="Content not found for this user")
    return content


@router.post("/recent", response_model=list[ContentWithSummary], status_code=200)
def get_recent_content(user_id: UUID = Depends(get_current_user_id), db: Session = Depends(get_db)):
    try:
        return get_recent_saved_content(user_id=user_id, db=db)
    
    except ContentNotFound:
        logger.error(f"Couldn't find any content recenty saved for user id {user_id}")
        raise HTTPException(
            status_code=204,
            detail="No content found for user"
        )

    except Exception as e:
        logger.error(f"Error occured in api endpoint '/content/recent' : {e}")
        return []  



@router.post("/import", status_code=200)
def import_browser_bookmarks(bookmark_data : BookmarkImportRequest, user_id: UUID = Depends(get_current_user_id), db: Session = Depends(get_db)):

    try:
        return import_browser_bookmarks_service(bookmark_data=bookmark_data, user_id=user_id, db=db)


    except Exception as e:
        logging.error(f"Error occured when trying to sync all bookmarks: {e}")
        return HTTPException(
            status_code=500,
            detail="Failed to save the browser data, try again"
        )




