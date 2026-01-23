from pydantic import BaseModel, Field, HttpUrl
from datetime import datetime
from typing import Optional

        #"content_payload": {
        #     "url": url,
        #     "title": title,
        #     "source": source,
        #     "first_saved_at": utc_time.isoformat(),
        # },
class ContentPayload(BaseModel):
    url: str
    title: str
    source: str 
    first_saved_at : str


    # payload = {
    #     "content_payload": {
    #         "url": url,
    #         "title": title,
    #         "source": source,
    #         "first_saved_at": utc_time.isoformat(),
    #     },
    #     "raw_html": html[0:50],
    #     "user_id": str(user_id),
    #     "notes": notes,
    #     "folder_id": str(folder_id) if folder_id else None,
    # }

class MessageContentPayload(BaseModel):
    url: str  
    title: str | None= ''
    source: str
    first_saved_at: datetime 

class MessageSchema(BaseModel):
    content_payload: MessageContentPayload
    raw_html: Optional[str ] = None
    user_id: str 
    notes: Optional[str] = None  
    folder_id: Optional[str] = 'default'  
    tag_ids: Optional[list[str]] = []