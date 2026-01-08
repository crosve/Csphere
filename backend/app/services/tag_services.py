from sqlalchemy.orm import Session
from app.schemas.tag import TagCreationData
from uuid import UUID
from app.data_models.user import User
from app.exceptions.tag_exceptions import TagsNotFound, TagAlreadyExists
from app.data_models.tag import Tag
from app.data_models.user_tag import UserTag
from datetime import datetime

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
        existing_user_tag = db.query(UserTag).filter(UserTag.user_id==user_id, tag.tag_id == UserTag.tag_id)
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

    
    print("user tags being returned: ", res)

    return res

