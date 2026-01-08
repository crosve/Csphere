from pydantic import BaseModel


class TagCreationData(BaseModel):
    tag_name: str = ''
    