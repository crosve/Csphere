from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session


from fastapi import APIRouter, Depends, HTTPException

from app.data_models.folder import Folder
from app.schemas.folder import  FolderDetails, FolderItem, FolderMetadata
from uuid import UUID
from uuid import uuid4
from datetime import datetime
from app.embeddings.embedding_manager import ContentEmbeddingManager
from typing import Optional

import logging

logger = logging.getLogger(__name__) 


class FolderNotFound(Exception):
    pass

class DuplicateFolder(Exception):
    pass

class FolderEmbeddingError(Exception):
    pass

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
