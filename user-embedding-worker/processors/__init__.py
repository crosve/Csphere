

from sqlalchemy.orm import Session

from enum import Enum
from pydantic import BaseModel

from .user_embedding import UserEmbeddingProcessor


class TaskType(str, Enum):
    """
    Pydantic types for each task type
    """

    EmbeddingUpdate: "process_embedding" 




def get_processor(task_type: str, db : Session):
    '''
    Returns the processor based on task_type
    possible task types are:
        process_embedding
    '''

    processors = {
        TaskType.EmbeddingUpdate : UserEmbeddingProcessor(db=db)
    }


    task_type_enum = TaskType(task_type)

    if not task_type_enum:
        print("issue when trying to convert task type into enum")

    return processors.get(task_type_enum)


