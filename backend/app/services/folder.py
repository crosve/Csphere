from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.data_models.folder import Folder
from app.schemas.folder import  FolderDetails, FolderItem, FolderMetadata
from uuid import UUID



class FolderNotFound(Exception):
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
    else:
        folder.keywords = []
        folder.url_patterns = []

    db.commit()
    db.refresh(folder)
    return folder
