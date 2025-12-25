from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime



                # 'folder_id' : folder.folder_id, 
                # 'folder_name' : folder.folder_name,
                # 'keywords' : folder.keywords, 
                # 'url_patterns': folder.url_patterns


class FolderBucketData(BaseModel):
    folder_id : str
    folder_name: str
    keywords: Optional[list[str] ] = None or []
    url_patterns: Optional[list[str]] = None or []



