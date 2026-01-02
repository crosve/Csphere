import logging
from uuid import uuid4
import re
import numpy as np
from datetime import datetime, timezone
from typing import List, Tuple, Optional

from .base import BaseProcessor
from data_models.content import Content
from data_models.content_item import ContentItem
from data_models.folder_item import folder_item  
from data_models.content_ai import ContentAI
from data_models.folder import Folder
from classes.EmbeddingManager import ContentEmbeddingManager
from exceptions.bucket_excpetions import FoldersNotFound, ItemExistInFolder, EmbeddingNotFound, ContentSummaryNotFound
from schemas.folder_schemas import FolderBucketData
from schemas.content_schemas import ContentPayload

from sqlalchemy.orm import Session

from rapidfuzz import fuzz

# Using pgvector specific functions if available in your SQLAlchemy setup
from sqlalchemy import func

logger = logging.getLogger(__name__)

class BucketProcessor(BaseProcessor):
    def __init__(self, db : Session, content_embedding: list[float] = None):
        super().__init__(db=db)
        self.content_embedding = content_embedding
        self.user_id = None

    def process(self, message: dict, content_id: str) -> bool:
        try:
            # 1. Data Extraction & State Setup
            # We capture user_id to scope the Vector Search later
            user_id, notes, folder_id, raw_html, content_data = self.extract_data(message=message)
            self.user_id = user_id

            # 2. Embedding Retrieval
            # If embedding isn't passed in, fetch the pre-calculated one from ContentAI table
            if self.content_embedding is None:
                self.content_embedding = self._get_content_embedding(content_id=content_id)
            
            # 3. Preparation for Matching

            #get the content summary 
            content_summary : str = self._get_content_ai_summary(content_id=content_id)
            content_text : str = f"{content_data.get('title', '')} {notes or ''}{content_summary or ''}".lower()
            content_url : str = content_data.get('url', '').lower()

            # 4. Hybrid Matching Engine
            # This calls the DB for the top 5, then reranks them locally
            matched_folder_id = self.find_best_matching_folder(
                content_title=content_data.get('title', ''),
                content_text=content_text,
                content_url=content_url
            )

            if matched_folder_id:
                logger.info(f"Content matched to folder: {matched_folder_id}")
                self.assign_to_folder(content_data, matched_folder_id, content_id, user_id)

                #Update the centroid matrix for a better learning rate 
                self.update_folder_learning(folder_id=matched_folder_id)
                return True
            
            logger.info("No confident match found for content.")
            return True

        except FoldersNotFound:
            logger.info(f"No bucketing folders found for user {self.user_id}, skipping.")
            return True
        except Exception as e:
            logger.error(f"Unexpected error in BucketProcessor: {e}", exc_info=True)
            return False

    #Next Steps:
    #Find a way to correlate words like playlist to music for better precision
    def find_best_matching_folder(self, content_title: str, content_text: str, content_url: str) -> Optional[str]:
        """
        Two-Step Matching: 
        1. Recall (Vector Search in DB)
        2. Rerank (Heuristics & Score Weighting)
        """
        # STEP 1: RECALL - Get Top 5 candidates from DB using pgvector
        # This is the "Amazon Level" efficiency - we don't loop over every folder in Python.
        candidates = self._get_best_matching_folders(self.content_embedding, self.user_id)
        
        if not candidates:
            return None

        scores = []

        for folder_row in candidates:
            folder : Folder = folder_row.Folder  # The Folder Object
            vector_similarity = folder_row.similarity  # The score from the DB search

            if not vector_similarity :
                continue
            logging.info(f"Current folder is: {folder.folder_name}")
            logging.info(f"Vector similarity score: {vector_similarity}")
            
            score = 0.0

            # LAYER 1: URL Pattern (The "Deterministic" Match)
            # If the URL matches a pattern, we give it a massive boost (Amazon-style Rule Engine)
            if folder.url_patterns:
                for pattern in folder.url_patterns:
                    try:
                        if re.search(pattern.lower(), content_url):
                            return folder.folder_id  # Immediate exit for high-confidence match
                    except re.error:
                        continue

            # LAYER 2: Keyword Overlap (The "Signal" Match)
            # Weights: 40% of the local reranking score
            if folder.keywords:
                matches = sum(1 for kw in folder.keywords if kw.lower() in content_text)
                keyword_score = (matches / len(folder.keywords))
                score += keyword_score * 0.2

            if folder.description and folder.description.strip():
                desc_similarity = fuzz.token_set_ratio(folder.description.lower(), content_text) / 100.0
                score += desc_similarity * 0.30 # 20% weight for descriptive context



            # LAYER 3: Semantic Strength (The "Intent" Match)
            # Weights: 50% of the local reranking score
            # We use the vector similarity already calculated by the DB!
            score += vector_similarity * 0.5

            #later on update based on saved bookmarks in this folder 

            scores.append((folder.folder_id, score))

        # Sort by total calculated score
        scores.sort(key=lambda x: x[1], reverse=True)

        logging.info(f"Current scoring of folders: {scores}")
        
        # CONFIDENCE THRESHOLD
        # Amazon doesn't match if it's not sure. 0.45 is a solid starting point for cosine similarity
        if scores and round(float(scores[0][1]),2  )>= 0.20:
            return scores[0][0]
        

        
        return None

    def _get_best_matching_folders(self, metadataVector: list[float], user_id: str):
        """
        Executes pgvector cosine distance search.
        Moves the compute-heavy similarity check to the database.
        """
        # Distance operator <=> calculates cosine distance (0 to 2)
        # We subtract from 1 to get similarity (1.0 is perfect match)
        cosine_dist = Folder.folder_embedding.cosine_distance(metadataVector)
        similarity = (1 - cosine_dist).label("similarity")

        results = (
            self.db.query(Folder, similarity)
            .filter(Folder.user_id == user_id)
            .filter(Folder.bucketing_mode == True)
            .order_by(cosine_dist) # Nearest distance first
            .limit(5)
            .all()
        )
        return results

    def _get_content_embedding(self, content_id: str) -> list[float]:
        """Fetch pre-calculated embedding from the AI table."""
        result = self.db.query(ContentAI.embedding).filter(ContentAI.content_id == content_id).first()
        
        if result is None:
            logger.error(f"No ContentAI record found for content_id {content_id}")
            raise EmbeddingNotFound(content_id=content_id)
            
        if result.embedding is None:
            logger.error(f"Embedding column is empty for content_id {content_id}")
            raise EmbeddingNotFound(content_id=content_id)
            
        return result.embedding

    def _create_folder_profile_embedding(self, folder: Folder):
        """
        Run this when a folder is created or metadata is updated.
        Creates a rich string representation for better vectorization.
        """
        parts = [
            f"Folder: {folder.folder_name}",
            f"Context: {', '.join(folder.keywords) if folder.keywords else ''}",
            f"Rules: {', '.join(folder.url_patterns) if folder.url_patterns else ''}"
        ]
        input_text = " ".join(parts)
        
        # Generate via your manager
        embedding_mgr = ContentEmbeddingManager(db=self.db)
        return embedding_mgr._generate_embedding(input_text)



    def assign_to_folder(self, content_data : ContentPayload, matched_folder_id : str, content_id : str, user_id : str)  -> bool:
        
        db = self.db
        present = db.query(folder_item).filter(content_id == folder_item.content_id, matched_folder_id == folder_item.folder_id, user_id == folder_item.user_id).first()

        if present:
          raise ItemExistInFolder(item_id=content_id, folder_id=matched_folder_id)

        try:
            new_item = folder_item(
                folder_item_id = uuid4(), 
                folder_id = matched_folder_id,
                user_id = user_id, 
                content_id = content_id,
                added_at = datetime.now(tz=timezone.utc)

            )

            db.add(new_item)
            db.commit()
            db.refresh(new_item)
            logging.info('succesfully saved the content to the folder')

            return {'success' : True, 'message' : 'Bookmark added to folder'} 



        except Exception as e:
            logging.error(f"Error matching folder {e}" )

   
    
    @staticmethod
    def _create_content_embeding(self, folder: Folder):
        parts = [
            f"Folder name: {folder.folder_name}",
            f"Description: {folder.description}" if folder.description else None,
            f"Keywords: {', '.join(folder.keywords)}" if folder.keywords else None,
            f"URL patterns: {', '.join(folder.url_patterns)}" if folder.url_patterns else None,
        ]

        embedding_text = "\n".join(p for p in parts if p)

        embedding_mgr = ContentEmbeddingManager(db=self.db)
        return embedding_mgr._generate_embedding(embedding_text)
    
    def _get_content_ai_summary(self, content_id):

        try:

            db = self.db 
            content_summary = db.query(ContentAI.ai_summary).filter(ContentAI.content_id == content_id ).first()

            if not content_summary:
                logging.error(f"Failed to fetch content summary")
                raise ContentSummaryNotFound(content_id=content_id)

            return content_summary.ai_summary
        except Exception as e:
            logging.error(f"Error occured trying to get the IA summary: {e}")


    def update_folder_learning(self, folder_id: str):
        """
        Updates the folder's vector profile based on newly added content.
        This allows the 'Amazon-level' matching to drift toward user habits.
        """
        db = self.db
        folder = db.query(Folder).filter(Folder.folder_id == folder_id).first()

        content_embedding : list[float] = self.content_embedding


        # if folder is None or folder.folder_embedding is None or content_embedding is None:


        if  folder is None or folder.folder_embedding is None or  content_embedding is None:
            logging.error("Folder, folder embedding, or content combedding not found")
            return

        # Convert to numpy arrays for vector math
        current_vec = np.array(folder.folder_embedding)
        new_content_vec = np.array(content_embedding)

        # LEARNING RATE (Alpha)
        # 0.1 means the folder profile is 90% history and 10% this new item.
        alpha = 0.1 

        # Calculate the new centroid
        updated_vec = ((1 - alpha) * current_vec) + (alpha * new_content_vec)

        # Re-normalize the vector (Crucial for Cosine Similarity to work correctly)
        norm = np.linalg.norm(updated_vec)
        if norm > 0:
            updated_vec = updated_vec / norm

        # Save back to DB
        folder.folder_embedding = updated_vec.tolist()
        db.commit()
        logger.info(f"Folder {folder_id} 'learned' from new content. Profile shifted.")

    




        




