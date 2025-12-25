import logging
from uuid import uuid4
import datetime

# Standardized imports: Grouping by standard library, third-party, then local modules
from .base import BaseProcessor
from data_models.content import Content
from data_models.content_item import ContentItem
from data_models.folder_item import folder_item  # Consider renaming to CamelCase if it's a class
from data_models.folder import Folder
from classes.EmbeddingManager import ContentEmbeddingManager
from exceptions.bucket_excpetions import FoldersNotFound
from schemas.folder_schemas import FolderBucketData
from schemas.content_schemas import ContentPayload

from typing import List, Tuple

from sklearn.metrics.pairwise import cosine_similarity
import re
import numpy as np

# Use the module-level logger consistently
logger = logging.getLogger(__name__)

class BucketProcessor(BaseProcessor):
    def __init__(self):
        super().__init__()


    def process(self, message: dict, content_id : str) -> bool:
        """
        Process the message metadata to match with the current users folders.
        """
        # 1. Added a try-except block around data extraction to handle malformed messages
        try:
            content_data : ContentPayload = None
            user_id, notes, folder_id, content_data = self.extract_data(message=message)
        except (KeyError, ValueError) as e:
            logger.error(f"Failed to extract data from message: {e}")
            return False

        try:
            user_folder_data : list[FolderBucketData] = self.get_user_folders(user_id=user_id)

            # html_content = self.get_html_content(content_data.url)

            # 1. Prepare Content for Matching
            # We combine title and notes to create a 'searchable' string
            content_text = f"{content_data.get('title', '')} {notes or ''}".lower()
            content_url = content_data.get('url', '').lower()

            # 2. Run the Matching Engine
            matched_folder_id = self.find_best_matching_folder(
                content_text=content_text,
                content_url=content_url,
                folders=user_folder_data
            )

            if matched_folder_id:
                logger.info(f"Content matched to folder: {matched_folder_id}")
                self.assign_to_folder(content_data, matched_folder_id, content_id, user_id)
            
            return True
    

        except FoldersNotFound:
            # 2. Changed logging to use 'logger' instance instead of 'logging' root
            logger.info(f"No bucketing folders found for user {user_id}, skipping.")
            return True
        
        except Exception as e:
            logger.error(f"Unexpected error processing folders for user {user_id}: {e}", exc_info=True)
            return False

    def get_user_folders(self, user_id: str) -> list[FolderBucketData]:
        """
        Retrieves active bucketing folders for a specific user.
        """

        user_folders = self.db.query(Folder).filter(
            Folder.user_id == user_id,
            Folder.bucketing_mode == True
        ).all()

        if not user_folders:
            # 4. FoldersNotFound should be raised if the list is empty
            raise FoldersNotFound()
        
        # 5. List comprehension is more "Pythonic" and faster than manual for-loops
        return [
            FolderBucketData(
                folder_id=f.folder_id,
                folder_name=f.folder_name,
                keywords=f.keywords,
                url_patterns=f.url_patterns
            ) for f in user_folders
        ]
    
    def find_best_matching_folder(self, content_text: str, content_url: str, folders: List[FolderBucketData]) -> str:
        """
        Amazon-level matching using a Weighted Scoring Algorithm.
        """
        scores = []

        for folder in folders:
            score = 0.0
            
            # LAYER 1: URL Pattern Matching (Weight: 1.0 - Instant Match)
            if folder.url_patterns:
                for pattern in folder.url_patterns:
                    if re.search(pattern.lower(), content_url):
                        return folder.folder_id  # Early exit for deterministic matches

            # LAYER 2: Keyword Boosting (Weight: 0.6)
            # We count how many keywords appear in the content
            if folder.keywords:
                matches = sum(1 for kw in folder.keywords if kw.lower() in content_text)
                score += (matches / len(folder.keywords)) * 0.6 if folder.keywords else 0

            # LAYER 3: Semantic Vector Similarity (Weight: 0.4)
            # Using your EmbeddingManager to compare intent
            try:
                folder_vector = self.embedding_manager._generate_embedding(folder.folder_name)
                content_vector = self.embedding_manager._generate_embedding(content_text)
                
                # Cosine similarity returns a value between 0 and 1
                semantic_score = cosine_similarity([folder_vector], [content_vector])[0][0]
                score += semantic_score * 0.4
            except Exception as e:
                logger.warning(f"Semantic match failed for folder {folder.folder_id}: {e}")

            scores.append((folder.folder_id, score))

        # Sort by score descending and pick the best one above a threshold
        scores.sort(key=lambda x: x[1], reverse=True)
        
        if scores and scores[0][1] > 0.35:  # Confidence Threshold
            return scores[0][0]
        
        return None



    def assign_to_folder(self, content_data : ContentPayload, matched_folder_id : str, content_id : str, user_id : str)  -> bool:
        
        db = self.db
        present = db.query(folder_item).filter(content_id == folder_item.content_id, matched_folder_id == folder_item.folder_id, user_id == folder_item.user_id).first()

        if present:
          raise 

        try:
            new_item = folder_item(
                folder_item_id = uuid4(), 
                folder_id = matched_folder_id,
                user_id = user_id, 
                content_id = content_id,
                added_at = datetime.utcnow()

            )

            db.add(new_item)
            db.commit()
            db.refresh(new_item)

            return {'success' : True, 'message' : 'Bookmark added to folder'} 



        except Exception as e:
            logging.error(f"Error matching folder {e}" )


