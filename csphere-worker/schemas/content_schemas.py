from pydantic import BaseModel, Field


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
