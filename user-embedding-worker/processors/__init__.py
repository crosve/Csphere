from sqlalchemy.orm import Session
from enum import Enum
import logging

from .user_embedding import UserEmbeddingProcessor

logger = logging.getLogger(__name__)

class TaskType(str, Enum):

    EmbeddingUpdate = "process_embedding" 

def get_processor(task_type: str, db: Session):
    try:
 
        task_type_enum = TaskType(task_type)
    except ValueError:
        logger.error(f"Invalid task type provided: {task_type}")
        return None

    if task_type_enum == TaskType.EmbeddingUpdate:
        return UserEmbeddingProcessor(db=db)
    
    return None