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


router = APIRouter(
    # prefix="/content"
)

logger = logging.getLogger(__name__) 



@router.get("/content/search", response_model=UserSavedContentResponse)
def search(query: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    manager = get_embedding_manager()
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

        _enqueue_new_content(
            url=safe_url,
            title=None, 
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

    

@router.get("/content/unread/count")
def get_unread_count(user_id: UUID = Depends(get_current_user_id), db: Session = Depends(get_db)):
    try:
        total_count = db.query(ContentItem).filter(ContentItem.user_id == user_id, ContentItem.read == False).count()

        logger.debug(f"Total count fetched for user id {user_id} : {total_count}")
        return {'status' : "succesful", 'total_count' : total_count}


    except Exception as e:
        logger.error(f"Error occured in count api router: {e}")
        return {'status' : 'unsuccesfull', 'error' : str(e)}


@router.get("/content/unread", response_model=UserSavedContentResponse)
def get_unread_content(cursor: str = None, user_id: UUID = Depends(get_current_user_id), db: Session = Depends(get_db)):
    print("in here")

    PAGE_SIZE = 18
    cursor_dt = None
    if cursor:

        try:
            cursor_dt = isoparse(cursor)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid cursor format. Use ISO8601 datetime.")
        

    query = (
        db.query(ContentItem, Content, ContentAI.ai_summary)
        .join(Content, ContentItem.content_id == Content.content_id)
        .outerjoin(ContentAI, Content.content_id == ContentAI.content_id)
        .options(joinedload(Content.categories))
        .filter(ContentItem.user_id == user_id, ContentItem.read == False)
    )

    if cursor_dt:
        query.filter(ContentItem.saved_at < cursor_dt)

    query = query.order_by(desc(ContentItem.saved_at)).limit(PAGE_SIZE + 1)

    results = query.all()

    # Check if we have more results
    has_next = len(results) > PAGE_SIZE
    results = results[:PAGE_SIZE]

    category_list = []
    bookmark_data = []


    
    results = (
        db.query(ContentItem, Content, ContentAI.ai_summary)
        .join(Content, ContentItem.content_id == Content.content_id)
        .outerjoin(ContentAI, Content.content_id == ContentAI.content_id)
        .options(joinedload(Content.categories))  # Eager load categories
        .filter(ContentItem.user_id == user_id, ContentItem.read == False)
        .order_by(desc(ContentItem.saved_at))
        .all()
    )

    bookmark_data = []
    category_list = []

    for item, content, ai_summary in results:
        tags = [CategoryOut.from_orm(cat) for cat in content.categories]
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


    # for item, content, ai_summary in results:
    #     tags = [CategoryOut.from_orm(cat) for cat in content.categories]
    #     bookmark_data.append(
    #         UserSavedContent(
    #             content_id=content.content_id,
    #             url=content.url,
    #             title=content.title,
    #             source=content.source,
    #             ai_summary=ai_summary,
    #             first_saved_at=item.saved_at,
    #             notes=item.notes,
    #             tags=tags
    #         )
    #     )
    #     category_list.extend(tags)

    # # Deduplicate categories by category_id
    # unique_categories = {cat.category_id: cat for cat in category_list}.values()

    # return {
    #     "bookmarks": bookmark_data,
    #     "categories": list(unique_categories),
    #     "has_next": True,
    #     "next_cursor": ''
    # }



@router.get("/content", response_model=UserSavedContentResponse)
def get_user_content(
    cursor: str = None,
    categories: list[str] = None, 
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    PAGE_SIZE = 10

    if categories:
        categories = set(categories)

    # Parse cursor into datetime if provided

    #note: adding in another param - filters of categories we need to fetch 
    cursor_dt = None
    if cursor:
        try:
            cursor_dt = isoparse(cursor)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid cursor format. Use ISO8601 datetime.")

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

@router.post("/content/update/notes")
def updatenote(data: NoteContentUpdate, user_id: UUID = Depends(get_current_user_id), db: Session = Depends(get_db)):
    previous_note = db.query(ContentItem).filter(ContentItem.content_id == data.bookmarkID).first()

    if not previous_note:
        raise HTTPException(status_code=404, detail="Content item not found")

    
    previous_note.notes = data.notes

    # Commit the change
    db.commit()

    return {"message": "Note updated successfully", "bookmarkID": str(data.bookmarkID)}








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
