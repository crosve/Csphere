from fastapi import HTTPException
from app.data_models.content import Content
from app.data_models.content_item import ContentItem
from app.data_models.content_ai import ContentAI
from app.data_models.folder_item import folder_item
from app.data_models.folder import Folder
from app.schemas.content import ContentWithSummary, UserSavedContent, TabRemover, NoteContentUpdate, CategoryOut, BookmarkImportRequest
from app.preprocessing.query_preprocessor import QueryPreprocessor
from app.deps.services import get_embedding_manager
from app.data_models.user import User
from datetime import datetime, timezone
import logging
from sqlalchemy.orm import joinedload
from dateutil.parser import isoparse
from app.core.settings import get_settings
from app.schemas.content import ContentCreatTags
from app.schemas.tag import TagOut

from sqlalchemy.orm import Session
from uuid import UUID
from sqlalchemy import desc 

import requests 
import json 

from email.utils import quote

import os

from app.exceptions.content_exceptions import EmbeddingManagerNotFound, NoMatchedContent, ContentItemNotFound, NotesNotFound, ContentNotFound

import logging


from dateutil.relativedelta import relativedelta
logger = logging.getLogger(__name__)
settings = get_settings()

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
    ACTIVEMQ_URL=settings.ACTIVEMQ_URL
    ACTIVEMQ_QUEUE= settings.ACTIVEMQ_QUEUE
    ACTIVEMQ_USER= settings.ACTIVEMQ_USER
    ACTIVEMQ_PASS= settings.ACTIVEMQ_PASS

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
    tags: list[ContentCreatTags ]| None,
    folder_id: str | UUID | None,
) -> None:
    utc_time = datetime.now(timezone.utc)

    #pase out only the content id's
    tag_ids = []
    if tags:
        for tag in tags:
            tag_ids.append(tag.tag_id)
            
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
        "tag_ids" : tag_ids
    }
    message = json.dumps(payload)
    result = push_to_activemq(message=message)
    
    if not result:
        raise HTTPException(status_code=503, detail="Failed to push to ActiveMQ")
    



def get_total_unread_count(user_id: str, db: Session):
    total_count = db.query(ContentItem).filter(ContentItem.user_id == user_id, ContentItem.read == False).count()

    logger.debug(f"Total count fetched for user id {user_id} : {total_count}")
    return {'status' : "succesful", 'total_count' : total_count}


def get_content_service(
    cursor: str, 
    filter_category_names: list[str], 
    user_id: UUID, 
    db: Session
):
    PAGE_SIZE = 9
    
    cursor_dt = None
    if cursor:
        try:
            cursor_dt = isoparse(cursor)
        except (ValueError, TypeError):
            raise ValueError("Datetime for cursor is wrongly formatted")


    query = (
        db.query(ContentItem, Content, ContentAI.ai_summary)
        .join(Content, ContentItem.content_id == Content.content_id)
        .outerjoin(ContentAI, Content.content_id == ContentAI.content_id)
        .options(
            joinedload(Content.categories),
            joinedload(ContentItem.tags) 
        )
        .filter(ContentItem.user_id == user_id)
    )

    if cursor_dt:
        query = query.filter(ContentItem.saved_at < cursor_dt)

    results = query.order_by(desc(ContentItem.saved_at)).limit(PAGE_SIZE + 1).all()
    
    has_next = len(results) > PAGE_SIZE
    paged_results = results[:PAGE_SIZE]

    bookmarks = []
    global_categories_seen = {} 

    filter_set = set(filter_category_names) if filter_category_names else None

    for item, content, ai_summary in paged_results:
        item_categories = [CategoryOut.from_orm(cat) for cat in content.categories]
        item_user_tags = [TagOut.from_orm(t) for t in item.tags]

        if filter_set:
            category_names = {cat.category_name for cat in item_categories}
            if not category_names.intersection(filter_set):
                continue  

        for cat in item_categories:
            global_categories_seen[cat.category_id] = cat


# class UserSavedContent(BaseModel):
#     content_id: UUID
#     url: str
#     title: Optional[str]
#     source: Optional[str]
#     ai_summary: Optional[str]
#     first_saved_at: datetime
#     notes: Optional[str]
#     tags: Optional[list[CategoryOut]]
        bookmarks.append(
            UserSavedContent(
                content_id=content.content_id,
                url=content.url,
                title=content.title,
                source=content.source,
                ai_summary=ai_summary,
                first_saved_at=item.saved_at,
                notes=item.notes,
                tags=item_user_tags,
                categories=item_categories
        
            )
        )

    # 4. Prepare Response
    next_cursor = bookmarks[-1].first_saved_at.isoformat() if bookmarks else None

    return {
        "bookmarks": bookmarks,
        "categories": list(global_categories_seen.values())[:10],
        "next_cursor": next_cursor,
        "has_next": has_next
    }



def get_unread_content_service(
    cursor: str, 
    filter_category_names: list[str], 
    user_id: UUID, 
    db: Session
):
    PAGE_SIZE = 9
    
    cursor_dt = None
    if cursor:
        try:
            cursor_dt = isoparse(cursor)
        except (ValueError, TypeError):
            raise ValueError("Datetime for cursor is wrongly formatted")


    query = (
        db.query(ContentItem, Content, ContentAI.ai_summary)
        .join(Content, ContentItem.content_id == Content.content_id)
        .outerjoin(ContentAI, Content.content_id == ContentAI.content_id)
        .options(
            joinedload(Content.categories),
            joinedload(ContentItem.tags) 
        )
        .filter(ContentItem.user_id == user_id, ContentItem.read == False)
    )

    if cursor_dt:
        query = query.filter(ContentItem.saved_at < cursor_dt)

    results = query.order_by(desc(ContentItem.saved_at)).limit(PAGE_SIZE + 1).all()
    
    has_next = len(results) > PAGE_SIZE
    paged_results = results[:PAGE_SIZE]

    bookmarks = []
    global_categories_seen = {} 

    filter_set = set(filter_category_names) if filter_category_names else None

    for item, content, ai_summary in paged_results:
        item_categories = [CategoryOut.from_orm(cat) for cat in content.categories]
        item_user_tags = [TagOut.from_orm(t) for t in item.tags]

        if filter_set:
            category_names = {cat.category_name for cat in item_categories}
            if not category_names.intersection(filter_set):
                continue  

        for cat in item_categories:
            global_categories_seen[cat.category_id] = cat


# class UserSavedContent(BaseModel):
#     content_id: UUID
#     url: str
#     title: Optional[str]
#     source: Optional[str]
#     ai_summary: Optional[str]
#     first_saved_at: datetime
#     notes: Optional[str]
#     tags: Optional[list[CategoryOut]]
        bookmarks.append(
            UserSavedContent(
                content_id=content.content_id,
                url=content.url,
                title=content.title,
                source=content.source,
                ai_summary=ai_summary,
                first_saved_at=item.saved_at,
                notes=item.notes,
                tags=item_user_tags,
                categories=item_categories
        
            )
        )

    # 4. Prepare Response
    next_cursor = bookmarks[-1].first_saved_at.isoformat() if bookmarks else None

    return {
        "bookmarks": bookmarks,
        "categories": list(global_categories_seen.values())[:10],
        "next_cursor": next_cursor,
        "has_next": has_next
    }

# def get_unread_content_service(cursor: str, user_id: UUID, db: Session):
#     PAGE_SIZE = 9
#     cursor_dt = None
    
#     if cursor:
#         try:
#             cursor_dt = isoparse(cursor)
#         except (ValueError, TypeError):
#             raise ValueError("Invalid cursor format")

#     # 1. Build the base query
#     query = (
#         db.query(ContentItem, Content, ContentAI.ai_summary)
#         .join(Content, ContentItem.content_id == Content.content_id)
#         .outerjoin(ContentAI, Content.content_id == ContentAI.content_id)
#         .options(joinedload(Content.categories))
#         .filter(ContentItem.user_id == user_id, ContentItem.read == False)
#     )

#     # 2. IMPORTANT: Re-assign the filtered query
#     if cursor_dt:
#         query = query.filter(ContentItem.saved_at < cursor_dt)

#     # 3. Order and Limit (fetch PAGE_SIZE + 1 to check for has_next)
#     results = query.order_by(desc(ContentItem.saved_at)).limit(PAGE_SIZE + 1).all()

#     has_next = len(results) > PAGE_SIZE
#     paged_results = results[:PAGE_SIZE]

#     bookmark_data = []
#     category_map = {}

#     for item, content, ai_summary in paged_results:
#         # Map categories and build unique list simultaneously
#         tags = []
#         for cat in content.categories:
#             tag = CategoryOut.from_orm(cat)
#             tags.append(tag)
#             category_map[tag.category_id] = tag

#         bookmark_data.append(
#             UserSavedContent(
#                 content_id=content.content_id,
#                 url=content.url,
#                 title=content.title,
#                 source=content.source,
#                 ai_summary=ai_summary,
#                 first_saved_at=item.saved_at,
#                 notes=item.notes,
#                 tags=tags
#             )
#         )

#     # Calculate next_cursor based on the last item in our paged results
#     next_cursor = bookmark_data[-1].first_saved_at.isoformat() if bookmark_data else None

#     return {
#         "bookmarks": bookmark_data,
#         "categories": list(category_map.values())[:10],
#         "next_cursor": next_cursor,
#         "has_next": has_next
#     }



def update_note_service(*, data: NoteContentUpdate, user_id: UUID , db: Session):

    previous_note = db.query(ContentItem).filter(ContentItem.content_id == data.bookmarkID, ContentItem.user_id==user_id).first()

    if not previous_note:
        raise NotesNotFound(content_id=data.bookmarkID)
        # raise HTTPException(status_code=404, detail="Content item not found")

    previous_note.notes = data.notes
    db.commit()

    return {"message": "Note updated successfully", "bookmarkID": str(data.bookmarkID)}




def tab_content(*, content: TabRemover,user_id: UUID , db: Session ):
    content_id = content.content_id

    query = db.query(Content).filter(
        Content.content_id == content_id
    )

    DBcontent : Content = query.one_or_none()


    if not DBcontent:
        raise ContentItemNotFound(content_id=content_id)

    #     raise HTTPException(
    #     status_code=400,
    #     detail="Content not found in the Contents table"
    # )




    existing_item : ContentItem = db.query(ContentItem).filter(
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
    
  

def untabContent(*, content: TabRemover,user_id: UUID , db : Session):

    content_id_to_delete = content.content_id

    # Construct the query to find the specific ContentItem to delete
    query = db.query(ContentItem).filter(
        ContentItem.user_id == user_id,
        ContentItem.content_id == content_id_to_delete
    )


    deleted_row_count = query.delete(synchronize_session='fetch')

    if deleted_row_count == 0:
        raise ContentItemNotFound(content_id=content_id_to_delete)
     
    

    db.commit()

    return {
        "message": "Content item successfully untabbed (deleted).",
        "user_id": user_id,
        "content_id": content_id_to_delete,
        "deleted_count": deleted_row_count
    }


def delete_content(content_id: UUID, user_id: UUID, db: Session):


    content = db.query(Content).filter(Content.content_id == content_id, Content.user_id == user_id).first()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found or not owned by user")

    
    db.delete(content)
    db.commit()
    return {
        'status' : 'success'
    }


def get_recent_saved_content(user_id : UUID, db : Session) -> list[ContentWithSummary]:

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

    if not results:
        raise ContentNotFound()


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



def webkit_to_iso(webkit_timestamp):
    if not webkit_timestamp:
        return None
    
    # Chrome timestamps are often in microseconds (16 digits) 
    # or milliseconds (13 digits). We need seconds.
    # 13 digits = milliseconds
    if webkit_timestamp > 1e15: 
        # Microseconds
        seconds = webkit_timestamp / 1_000_000
    else:
        # Milliseconds
        seconds = webkit_timestamp / 1_000

    # Apply the offset between 1601 and 1970
    unix_time = seconds - 11644473600
    
    return datetime.fromtimestamp(unix_time, tz=timezone.utc).isoformat()
    

def import_browser_bookmarks_service(bookmark_data: BookmarkImportRequest, user_id: UUID, db: Session):
    bookmarks_list = []

    def collect_bookmarks(node, folder_path="Root"):

        if node.children is not None:
            new_path = f"{folder_path} > {node.title}"
            for child in node.children:
                collect_bookmarks(child, new_path)
        
        elif node.url:
            if node.url.startswith('https'):
                bookmarks_list.append({                    
                    'url': node.url,
                    'title': node.title,
                    'source': 'browser import', 
                    'first_saved_at': webkit_to_iso(node.dateAdded)
                })


    for root_node in bookmark_data.bookmarks:
        collect_bookmarks(root_node)

    print(f"Successfully collected {len(bookmarks_list)} bookmarks")

    for bookmark in bookmarks_list:
        payload = {
            "content_payload":bookmark,
            "raw_html": '',
            "user_id" : str(user_id),
            "notes" : '',
            'folder_id': '', 
            'tags_ids' : []

        }


        message = json.dumps(payload)
        result = push_to_activemq(message=message)
        if result:
            continue 
        else:
            logging.error('Failed to push to active mq')
            


    
    # Now you can proceed to save bookmarks_list to your DB
    return {'status' : 'success', 'message' : 'All bookmarks have been pushed'}


def get_discover_content_service(user_id: str, db: Session):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        return [] # Or raise an HTTPException

    user_embedding = user.user_embedding
    discovered_content = []

    # Iterate through the last 6 months
    for i in range(6):
        start_date = (datetime.now() - relativedelta(months=i)).replace(day=1, hour=0, minute=0, second=0)
        end_date = start_date + relativedelta(months=1)

        # Query for top 4 similar items in this specific month
        # Using pgvector operator <=> for cosine similarity
        month_items = (
            db.query(ContentItem, Content, ContentAI, )
            .join(Content, Content.content_id == ContentItem.content_id)
            .join(ContentAI, Content.content_id == ContentAI.content_id)
            .filter(ContentItem.user_id == user_id)
            .filter(ContentItem.saved_at >= start_date)
            .filter(ContentItem.saved_at < end_date)
            .filter(ContentItem.read == False)
            .order_by(ContentAI.embedding.cosine_distance(user_embedding))
            .limit(5)
            .all()
        )


        for content_item, content, ai in month_items:
            discovered_content.append(ContentWithSummary(
                content_id=content.content_id,
                title=content.title,
                url=content.url,
                source=content.source,
                first_saved_at=content_item.saved_at,
                ai_summary=ai.ai_summary,
                folder=''
            ))

    return discovered_content