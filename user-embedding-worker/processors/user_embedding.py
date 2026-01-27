import logging
from uuid import uuid4
import re
import numpy as np
from datetime import datetime, timezone
from typing import List, Tuple, Optional


#Data models import
from data_models.user import User
from data_models.content_item import ContentItem
from data_models.content import Content


#Schemas import
from schemas.user import UserEmbeddingData




from sqlalchemy.orm import Session

from rapidfuzz import fuzz

# Using pgvector specific functions if available in your SQLAlchemy setup
from sqlalchemy import func

from processors.base_processor import BaseProcessor



class UserEmbeddingProcessor(BaseProcessor):
    def __init__(self, db : Session):
        super().__init__(db=db)


    def process_users_embeddings(self):
        '''
        Processes all users embeddings model based on the 
        previous date time
        '''
        db = self.db

        user_data : list[UserEmbeddingData] = self.get_users()

        



    def get_users(self) -> list[UserEmbeddingData]:
        db = self.db 

        users : list[User] = db.query(User).all()


        if not users:
            logging.error("Something went wrong when fetching the users")


        #return the users_id and embeddings

        res = []

        for user in users:
            res.append(

                UserEmbeddingData(
                    user_id=user.id,
                    user_embedding=user.user_embedding,
                    last_update=user.last_embedding_update
                )

            )

        return res
    
    def get_users_bookmarks(self,user_id: str,  timestamp: datetime):
        db = self.db

        users_bookmarks : list[ContentItem] = db.query(ContentItem, Content).filter(ContentItem.user_id == user_id, ContentItem.saved_at >= timestamp).join(ContentItem.user_id == Content.user_id).all()

        if not users_bookmarks:
            logging.info(f"User id {user_id} did not have any content saved/found")
            return
        

        
        


        













        

    