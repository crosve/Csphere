from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime

class TagCreationData(BaseModel):
    tag_name: str = ''
    

class TagDeleteData(BaseModel):
    tag_ids : list[str] = []


class TagUpdateData(BaseModel):
    tag_name: str


class TagOut(BaseModel):
    tag_id: UUID
    tag_name: str
    user_id: UUID
    # Optional: include this if you want to show when the tag was made
    # first_created_at: datetime 

    model_config = ConfigDict(from_attributes=True)
