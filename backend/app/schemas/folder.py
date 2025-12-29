from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime


class FolderDetails(BaseModel):
    foldername: str = Field(..., min_length=1) 
    folderId: Optional[UUID]

class FolderCreate(BaseModel):
    folder_id: str 
    user_id: str
    parent_id : str
    folder_name: str
    created_at: datetime = None 


class FolderItem(BaseModel):
    folderId: str
    contentId: str


 #   name: string;
#   keywords: string[];
#   urlPatterns: string[];
#   smartBucketingEnabled: boolean;   

class FolderMetadata(BaseModel):
    name: str
    smartBucketingEnabled: bool
    description: Optional[str] = ''
    keywords: list[str]
    urlPatterns: list[str]