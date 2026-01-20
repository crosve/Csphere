from sqlalchemy.orm import Session
from app.schemas.tag import TagCreationData, TagDeleteData
from uuid import UUID
from app.data_models.user import User
from app.exceptions.tag_exceptions import TagsNotFound, TagAlreadyExists
from app.data_models.tag import Tag
from app.data_models.user_tag import UserTag
from datetime import datetime
from sqlalchemy import delete
from uuid import uuid4


import logging

logger = logging.getLogger(__name__) 

def create_tag_service ( user_id: UUID,  tag_data : TagCreationData,  db : Session):

    #find if the tag already exists in the database
    tag : Tag = None
    exists = db.query(Tag).filter(Tag.tag_name == tag_data.tag_name).first()

    if exists:
        tag = exists

        #confirm they're not already connected 
        existing_user_tag = db.query(UserTag).filter(UserTag.user_id==user_id, tag.tag_id == UserTag.tag_id).first()
        if existing_user_tag:
            raise TagAlreadyExists()
    
    else:
        tag = Tag(
            tag_id=uuid4(),
            tag_name=tag_data.tag_name,
            first_created_at=datetime.utcnow()
        )

        db.add(tag)
        db.commit()
        db.refresh(tag)


    #create the unity in the user_tag table


    new_user_tag : UserTag = UserTag(
        user_id=user_id,
        tag_id=tag.tag_id,
        first_created_at=datetime.utcnow()
    )

    db.add(new_user_tag)
    db.commit()
    db.refresh(new_user_tag)



    return {
        'success' : True, 
        'newTag' : new_user_tag
        
    }
    

    

    
    

    




    

    

def get_user_tags_service(user_id : UUID, db : Session):

    user : User = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise TagsNotFound()
    
    user_tags : UserTag = user.user_tags
    res = []

    for tags_data in user_tags:
        tag_id = tags_data.tag_id

        curr_tag : Tag = db.query(Tag).filter(Tag.tag_id == tag_id).first()
        if not curr_tag:
            continue
        res.append({
            'tag_name': curr_tag.tag_name,
            'tag_id' : curr_tag.tag_id

        })

    
    return res




# class User(Base):
#     __tablename__ = "users"

#     id = Column(UUID(as_uuid=True), primary_key=True, default=uuid)
#     email = Column(String, unique=True, nullable=False)
#     created_at = Column(TIMESTAMP, server_default="NOW()")
#     username = Column(String,  nullable=False)
#     password = Column(String, nullable=False)
#     google_id = Column(String, nullable=True)
#     profile_path = Column(String, default='')

#     user_tags: Mapped[list["UserTag"]] = relationship("UserTag", back_populates="user")
def delete_user_tags_service(user_id: UUID, tag_ids: list[UUID], db: Session):
    # We use a bulk delete statement for efficiency
    stmt = (
        delete(UserTag)
        .where(UserTag.user_id == user_id)
        .where(UserTag.tag_id.in_(tag_ids))
    )
    
    result = db.execute(stmt)
    db.commit()

    return {
        "status": "success", 
        "deleted_count": result.rowcount
    }