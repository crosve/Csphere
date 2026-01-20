from pydantic import BaseModel


class TagCreationData(BaseModel):
    tag_name: str = ''
    

class TagDeleteData(BaseModel):
    tag_ids : list[str] = []
