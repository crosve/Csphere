from sqlalchemy.orm import Session, joinedload
from app.schemas.tag import TagCreationData
from uuid import UUID, uuid4
from app.exceptions.tag_exceptions import TagsNotFound, TagAlreadyExists, TagNotFound
from app.schemas.content import ContentWithSummary
from app.data_models.tag import Tag
from app.data_models.content import Content
from app.data_models.content_item import ContentItem
from app.data_models.content_tag import ContentTag
from app.data_models.content_ai import ContentAI
from app.schemas.content import ContentWithSummary, UserSavedContent, TabRemover, NoteContentUpdate, CategoryOut, BookmarkImportRequest
from app.schemas.tag import TagOut

from datetime import datetime
from sqlalchemy import delete, desc
import logging

logger = logging.getLogger(__name__) 

def create_tag_service(user_id: UUID, tag_data: TagCreationData, db: Session):
    # Check if this specific user already has a tag with this name
    exists = db.query(Tag).filter(
        Tag.tag_name == tag_data.tag_name, 
        Tag.user_id == user_id
    ).first()

    if exists:
        raise TagAlreadyExists()
    
    # Every tag is now unique to the user
    new_tag = Tag(
        tag_id=uuid4(),
        tag_name=tag_data.tag_name,
        user_id=user_id, # Ownership is now direct
        first_created_at=datetime.utcnow()
    )

    db.add(new_tag)
    db.commit()
    db.refresh(new_tag)

    return {
        'success': True, 
        'newTag': new_tag
    }

def get_user_tags_service(user_id: UUID, db: Session):
    # Direct fetch from Tag table using user_id
    tags = db.query(Tag).filter(Tag.user_id == user_id).all()
    print("all user tags: ", tags)

    if not tags:
        # Keeping your existing logic, though an empty list is often preferred over an exception
        return []
    
    logging.info(f"All the tags: {tags}")
    
    return [
        {
            'tag_name': tag.tag_name,
            'tag_id': tag.tag_id
        } for tag in tags
    ]

def delete_user_tags_service(user_id: UUID, tag_ids: list[UUID], db: Session):
    # We delete directly from the Tag table. 
    # Ensuring user_id matches prevents a user from deleting someone else's tags.
    stmt = (
        delete(Tag)
        .where(Tag.user_id == user_id)
        .where(Tag.tag_id.in_(tag_ids))
    )
    
    result = db.execute(stmt)
    db.commit()

    return {
        "status": "success", 
        "deleted_count": result.rowcount
    }

def update_tag_service(user_id: UUID, tag_id: str, updated_tag_name: str, db: Session):
    # Check ownership and existence in one query
    target_tag = db.query(Tag).filter(
        Tag.tag_id == tag_id, 
        Tag.user_id == user_id
    ).first()

    if not target_tag:
        # This replaces the need for UserTagRelationNotFound
        raise TagNotFound()
    
    if target_tag.tag_name == updated_tag_name:
        return {'status': 'success'}
    
    # Check if the NEW name already exists for this user to avoid duplicates during update
    name_check = db.query(Tag).filter(
        Tag.tag_name == updated_tag_name, 
        Tag.user_id == user_id
    ).first()
    
    if name_check:
        raise TagAlreadyExists()

    target_tag.tag_name = updated_tag_name
    db.commit()

    return {'status': 'success'}


def fetch_tag_bookmark_service(tag_id: str, user_id: str, db: Session):
    try:
        query = (
            db.query(ContentItem, Content, ContentAI.ai_summary)
            .join(Content, ContentItem.content_id == Content.content_id)
            .outerjoin(ContentAI, Content.content_id == ContentAI.content_id)
            # Use .c to access columns on Table objects
            .join(ContentTag, ContentItem.content_id == ContentTag.c.content_id)
            .options(
                joinedload(ContentItem.tags),
                joinedload(Content.categories)
            )
            .filter(
                ContentItem.user_id == user_id,
                ContentTag.c.tag_id == tag_id # Added .c here too
            )
        )

        results = query.order_by(desc(ContentItem.saved_at)).all()

        bookmarks = []
        for item, content, ai_summary in results:
            item_user_tags = [TagOut.from_orm(t) for t in item.tags]
            item_categories = [CategoryOut.from_orm(cat) for cat in content.categories]

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
        return bookmarks

    except Exception as e:
        # This will now capture the specific line if it fails again
        logging.error(f"Failed to fetch bookmarks connected to the id: {e}")
        return []