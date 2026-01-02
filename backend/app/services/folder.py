from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session


from fastapi import APIRouter, Depends, HTTPException

from app.data_models.folder import Folder
from app.data_models.content_ai import ContentAI
from app.schemas.folder import  FolderDetails, FolderItem, FolderMetadata
from uuid import UUID
from uuid import uuid4
from datetime import datetime
from app.embeddings.embedding_manager import ContentEmbeddingManager
from typing import Optional
from app.data_models.folder_item import folder_item

from app.exceptions.folder import FolderNotFound, DuplicateFolder, FolderEmbeddingError, FolderItemNotFound

import numpy as np
import logging

logger = logging.getLogger(__name__) 


def update_folder_metadata(
    *,
    db: Session,
    folder_id: UUID,
    user_id: UUID,
    metadata: FolderMetadata,
) -> Folder:
    folder : Folder = (
        db.query(Folder)
        .filter(
            Folder.folder_id == folder_id,
            Folder.user_id == user_id,
        )
        .first()
    )

    if not folder:
        raise FolderNotFound()
    
    #save the previous folder embedding
    prev_embedding = folder.folder_embedding

    folder.folder_name = metadata.name
    folder.bucketing_mode = metadata.smartBucketingEnabled

    print("current url patterns: ", metadata)

    if metadata.smartBucketingEnabled:
        folder.keywords = metadata.keywords
        folder.url_patterns = metadata.urlPatterns
        folder.description = metadata.description

    else:
        folder.bucketing_mode = False
        # folder.keywords = []
        # folder.url_patterns = []

    db.commit()
    db.refresh(folder)

    new_folder_embedding = create_folder_embedding(db=db, folder=folder)

    if new_folder_embedding is not None and prev_embedding is not None:
        
        alpha = 0.7
        old_vec = np.array(prev_embedding)
        meta_vec = np.array(new_folder_embedding)
        
        blended_vec = (alpha * meta_vec) + ((1 - alpha) * old_vec)
        
        # Re-normalize
        norm = np.linalg.norm(blended_vec)
        if norm > 0:
            blended_vec = blended_vec / norm
        
        folder.folder_embedding = blended_vec.tolist()
        
        
    else:
        folder.folder_embedding = new_folder_embedding
    db.commit()
    return folder


def create_folder_embedding(
    db: Session,
    folder: Folder
) -> Optional[list[float]]:
    try:
        parts = [
            f"Folder name: {folder.folder_name}",
            f"Description: {folder.description}" if folder.description else None,
            f"Keywords: {', '.join(folder.keywords)}" if folder.keywords else None,
            f"URL patterns: {', '.join(folder.url_patterns)}" if folder.url_patterns else None,
        ]

        embedding_text = "\n".join(p for p in parts if p)

        embedding_mgr = ContentEmbeddingManager(db=db)
        return embedding_mgr._generate_embedding(embedding_text)

    except Exception:
        logging.exception("Failed to create folder embedding")
        return None



def create_user_folder(
    *,
    db: Session,
    folderDetails: FolderDetails,
    user_id: UUID
):
    exists = db.query(Folder).filter(
        Folder.user_id == user_id,
        Folder.folder_name == folderDetails.foldername
    ).first()

    if exists:
        raise HTTPException(status_code=400, detail="Folder already exists")

    folder_uuid = uuid4()

    new_folder = Folder(
        folder_id=folder_uuid,
        user_id=user_id,
        parent_id=folderDetails.folderId or folder_uuid,
        folder_name=folderDetails.foldername,
        bucketing_mode=False,
        keywords=[],
        url_patterns=[],
        description='',
        folder_embedding=None,
        created_at=datetime.utcnow()
    )

    try:
        db.add(new_folder)
        db.commit()
        db.refresh(new_folder)

        # Best-effort embedding
        embedding = create_folder_embedding(db, new_folder)
        if embedding:
            new_folder.folder_embedding = embedding
            db.commit()

        return {
            'success': True,
            'message': 'folder created successfully',
            'folder_details': {
                'folder_id': new_folder.folder_id,
                'created_at': new_folder.created_at,
                'folder_name': new_folder.folder_name,
                'parent_id': new_folder.parent_id,
                'file_count': 0
            }
        }

    except Exception:
        db.rollback()
        logging.exception("Failed to create folder")
        raise HTTPException(status_code=500, detail="Failed to create folder")


def addItemToFolder(*, db: Session,user_id: UUID,  folder_id: str, itemDetails: FolderItem) :
    present = db.query(folder_item).filter(itemDetails.contentId == folder_item.content_id, itemDetails.folderId == folder_item.folder_id, user_id == folder_item.user_id).first()

    if present:
        raise HTTPException(status_code=400, detail="Item already in the folder")
    
    try:
        new_item = folder_item(
            folder_item_id = uuid4(), 
            folder_id = itemDetails.folderId,
            user_id = user_id, 
            content_id = itemDetails.contentId,
            added_at = datetime.utcnow()

        )

        db.add(new_item)
        db.commit()
        db.refresh(new_item)

        #update the folder leanring now
        if update_folder_learning(db=db, folder_id=itemDetails.folderId, content_id=itemDetails.contentId):
            logging.info(f"Folder centroid updated for folder id {itemDetails.folderId}")

        else:
            logging.error(f"Folder centroid failed to updated for folder id {itemDetails.folderId} ")

        return {'success' : True, 'message' : 'Bookmark added to folder'} 


    except Exception as e:
        return {'success': False, 'message' : str(e)} 
    



def update_folder_learning(db: Session, folder_id: str, content_id: str):
    """
    Updates the folder's vector profile based on newly added content.
    """
    try:
        folder: Folder = db.query(Folder).filter(Folder.folder_id == folder_id).first()
        content_embedding = get_content_embedding(db=db, content_id=content_id)

        # Use 'is None' to avoid NumPy ambiguity errors
        if folder is None or folder.folder_embedding is None or content_embedding is None:
            logging.error(f"Learning skipped: Missing data for folder {folder_id} or content {content_id}")
            return False

        # Convert to numpy arrays
        current_vec = np.array(folder.folder_embedding)
        new_content_vec = np.array(content_embedding)

        # Ensure they are the same shape (e.g., both 1536 dimensions)
        if current_vec.shape != new_content_vec.shape:
            logging.error(f"Shape mismatch: Folder({current_vec.shape}) vs Content({new_content_vec.shape})")
            return False

        alpha = 0.1 
        updated_vec = ((1 - alpha) * current_vec) + (alpha * new_content_vec)

        # Normalization is key for Cosine Similarity
        norm = np.linalg.norm(updated_vec)
        if norm > 0:
            updated_vec = updated_vec / norm

        # Save back to DB
        folder.folder_embedding = updated_vec.tolist()
        db.commit()
        
        logging.info(f"Folder {folder_id} successfully shifted toward content {content_id}")
        return True

    except Exception as e:
        db.rollback() # Always rollback on error during a learning shift
        logging.error(f"Error occurred when trying to shift the folder embedding model: {e}")
        return False



def get_content_embedding(db: Session, content_id: str) -> list[float]:
    """
        Get the embedding stored in the database for the content item with content_id
    """
    try:
        result = (
            db.query(ContentAI.embedding)
            .filter(ContentAI.content_id == content_id)
            .first()
        )

        if result is None:
            raise HTTPException(
                status_code=404,
                detail=f"Content with content id {content_id} not found"
            )

        (embedding,) = result
        return embedding

    except HTTPException:
        raise
    except Exception as e:
        logging.exception(
            f"Failed to fetch content embedding for content_id={content_id}"
        )
        raise HTTPException(status_code=500, detail="Internal server error")
    


def _update_folder_embedding( db: Session,folder: Folder) -> Optional[list[float]]:

    try:
        prev_embedding = folder.folder_embedding
        parts = [
            f"Folder name: {folder.folder_name}",
            f"Description: {folder.description}" if folder.description else None,
            f"Keywords: {', '.join(folder.keywords)}" if folder.keywords else None,
            f"URL patterns: {', '.join(folder.url_patterns)}" if folder.url_patterns else None,
        ]

        embedding_text = "\n".join(p for p in parts if p)

        embedding_mgr = ContentEmbeddingManager(db=db)
        return embedding_mgr._generate_embedding(embedding_text)

    except Exception:
        logging.exception("Failed to create folder embedding")
        return None


def get_folder_or_404(db: Session, folder_id: UUID) -> Folder:
    folder = (
        db.query(Folder)
        .filter(Folder.folder_id == folder_id)
        .first()
    )
    if not folder:
        raise FolderNotFound()
    return folder

    
def _penalize_folder_learning(db: Session, folder_id: str, content_id: str):
    """
    Moves the folder embedding AWAY from the content embedding.
    Used when a user manually removes an item they feel was misclassified.
    """
    try:
        folder = db.query(Folder).filter(Folder.folder_id == folder_id).first()
        content_embedding = get_content_embedding(db, content_id)

        if folder is None or folder.folder_embedding is None or content_embedding is None:
            return False

        current_vec = np.array(folder.folder_embedding)
        removed_vec = np.array(content_embedding)

        # PENALIZATION RATE (Beta)
        # We use a smaller rate so one removal doesn't ruin the whole folder
        beta = 0.15

        # Vector Subtraction: Move current_vec away from removed_vec
        # New = Current - Beta * (Removed - Current)
        updated_vec = current_vec - beta * (removed_vec - current_vec)

        # Re-normalize to keep it a valid unit vector for cosine similarity
        norm = np.linalg.norm(updated_vec)
        if norm > 0:
            updated_vec = updated_vec / norm

        # Save the "corrected" identity
        folder.folder_embedding = updated_vec.tolist()
        
        
        db.commit()
        logger.info(f"Folder {folder_id} penalized. Moved away from content {content_id}.")
        return True

    except Exception as e:
        db.rollback()
        logger.error(f"Failed to penalize folder: {e}")
        return False

def remove_contents_from_folder(
    db: Session,
    folder_id: UUID,
    user_id: UUID,
    content_ids: list[str],
):
    if not content_ids:
        return {"status": "success", "removed": 0}

    try:
        get_folder_or_404(db, folder_id)

        deleted_count = (
            db.query(folder_item)
            .filter(
                folder_item.folder_id == folder_id,
                folder_item.user_id == user_id,
                folder_item.content_id.in_(content_ids),
            )
            .delete(synchronize_session=False)
        )

        if deleted_count == 0:
            raise FolderItemNotFound("No matching content found in folder")

        db.commit()

        #Penalize the learning vector 
        #Later in the future make a vectore status to compare content with a vector of 
        #contents that has been removed in the past
        logging.info('Penalizing folder with the removed data')
        for content_id in content_ids:
            _penalize_folder_learning(db=db, folder_id=folder_id, content_id=content_id)

        return {
            "status": "success",
            "removed": deleted_count,
        }

    except Exception as e:
        db.rollback()
        logging.error(
            f"Failed to remove content from folder {folder_id}: {e}",
            exc_info=True,
        )
        raise


