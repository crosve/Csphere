

from sqlalchemy.orm import Session

from enum import Enum
from pydantic import BaseModel


class TaskType(str, Enum):
    """
    Pydantic types for each task type
    """

    EmbeddingUpdate: '1' #use one as the embedding update



def get_processor(task_type: str, db : Session):
    '''
    Returns the processor based on task_type
    Possible task_types to input:
        process_message
        process_folder
    
    :param task_type: processor key name you want
    :type task_type: str
    '''