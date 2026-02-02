from pydantic import BaseModel, HttpUrl
from typing import Optional, List
from uuid import UUID
from datetime import datetime

from app.schemas.tag import TagOut
class NoteContentUpdate(BaseModel):
    notes: str
    bookmarkID: UUID


class ContentCreatTags(BaseModel):
     tag_name: str
     tag_id: str


class ContentCreate(BaseModel):
    url: str
    title: Optional[str]
    tags: Optional[list[ContentCreatTags]]
    notes: Optional[str]
    folder_id: Optional[UUID] = None
    html: str

class TabRemover(BaseModel):
    content_id: UUID 

class DBContent(BaseModel):
    url: str
    title: Optional[str]
    source: Optional[str]

class ContentWithSummary(BaseModel):
    content_id: UUID
    title: Optional[str]
    url: str
    source: Optional[str]
    first_saved_at: datetime 
    ai_summary: Optional[str]
    folder: Optional[str]

    class Config:
        from_attributes = True

class ContentSavedByUrl(BaseModel):
    url: str

class CategoryOut(BaseModel):
    category_id: UUID
    category_name: str

    class Config:
        from_attributes = True

class UserSavedContent(BaseModel):
    content_id: UUID
    url: str
    title: Optional[str]
    source: Optional[str]
    ai_summary: Optional[str]
    first_saved_at: datetime
    notes: Optional[str]
    tags: Optional[list[TagOut]]
    categories: Optional[list[CategoryOut]]

class CategoryItem(BaseModel):
    category_id: str
    category_name: str
 
class UserSavedContentResponse(BaseModel):
    bookmarks: list[UserSavedContent]
    categories: Optional[list[CategoryOut] ] = []
    next_cursor: Optional[str] = ''
    has_next: Optional[bool] = False



class BookmarkNode(BaseModel):
    id: str
    title: str
    parentId: Optional[str] = None
    index: Optional[int] = None
    url: Optional[str] = None  # Only present on bookmarks
    dateAdded: Optional[float] = None
    dateLastUsed: Optional[float] = None
    # 'children' makes the model recursive
    children: Optional[List["BookmarkNode"]] = None 
    
    # These fields appear on specific folders like the Bookmarks Bar
    folderType: Optional[str] = None
    dateGroupModified: Optional[float] = None

    class Config:
        # This allows the model to handle the recursive 'BookmarkNode' reference
        arbitrary_types_allowed = True

class BookmarkImportRequest(BaseModel):
    bookmarks: List[BookmarkNode]