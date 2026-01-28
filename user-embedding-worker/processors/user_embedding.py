import logging
from uuid import uuid4
import re
import numpy as np
from datetime import datetime, timezone
from typing import List, Tuple, Optional


#Data module imports
import numpy as np

#Data models import
from data_models.user import User
from data_models.content_item import ContentItem
from data_models.content import Content
from data_models.content_ai import ContentAI


#Schemas import
from schemas.user import UserEmbeddingData




from sqlalchemy.orm import Session

from rapidfuzz import fuzz

# Using pgvector specific functions if available in your SQLAlchemy setup
from sqlalchemy import func

from processors.base_processor import BaseProcessor



class UserEmbeddingProcessor(BaseProcessor):
    def __init__(self, db: Session):
        super().__init__(db=db)

    def process_users_embeddings(self):
        '''
        Processes all users embeddings model based on the 
        previous date time
        '''
        db = self.db
        user_data: list[UserEmbeddingData] = self.get_users()

        for user_dto in user_data:
            user_id = user_dto.user_id
            current_sync_time = datetime.now(timezone.utc)

            content_embeddings_data = self.get_users_bookmarks(
                user_id=user_id, 
                timestamp=user_dto.last_update
            )

            if not content_embeddings_data:
                logging.info(f"No new embeddings found for user {user_id}")
                continue

            new_user_embedding = self.calculate_centroid(
                user_dto.user_embedding, 
                content_embeddings=content_embeddings_data
            )

            try:
                db.query(User).filter(User.id == user_id).update({
                    User.user_embedding: new_user_embedding,
                    User.last_embedding_update: current_sync_time
                })
                db.commit()
                logging.info(f"Successfully updated embedding for user {user_id}")
            except Exception as e:
                db.rollback()
                logging.error(f"Failed to update user {user_id}: {e}")

    def get_users_bookmarks(self, user_id: str, timestamp: Optional[datetime]):
        db = self.db
        
        if timestamp is None:
            timestamp = datetime(1970, 1, 1, tzinfo=timezone.utc)

        query = (
            db.query(ContentAI.embedding)
            .join(Content, Content.content_id == ContentAI.content_id)
            .join(ContentItem, ContentItem.content_id == Content.content_id)
            .filter(
                ContentItem.user_id == user_id,
                ContentItem.saved_at > timestamp
            )
        )

        results = query.all()

        if not results:
            return None
        
        return [row[0] for row in results if row[0] is not None]

    def calculate_centroid(self, user_embedding, content_embeddings):
        if not content_embeddings:
            return user_embedding

        data = np.array(content_embeddings)
        new_mean = np.mean(data, axis=0)

        if user_embedding is None:
            return new_mean.tolist()

        alpha = 0.2
        existing_vec = np.array(user_embedding)
        
        merged_embedding = (existing_vec * (1 - alpha)) + (new_mean * alpha)
        
        return merged_embedding.tolist()

        
        


        













        

    