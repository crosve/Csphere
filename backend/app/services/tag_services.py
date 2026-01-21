from sqlalchemy.orm import Session
from app.schemas.tag import TagCreationData
from uuid import UUID, uuid4
from app.exceptions.tag_exceptions import TagsNotFound, TagAlreadyExists, TagNotFound
from app.data_models.tag import Tag
from datetime import datetime
from sqlalchemy import delete
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

    if not tags:
        # Keeping your existing logic, though an empty list is often preferred over an exception
        return []
    
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