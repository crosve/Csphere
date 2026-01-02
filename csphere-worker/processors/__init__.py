from .content import ContentProcessor
from .bucket import BucketProcessor
from sqlalchemy.orm import Session





def get_processor(task_type: str, db : Session):
    '''
    Returns the processor based on task_type
    Possible task_types to input:
        process_message
        process_folder
    
    :param task_type: processor key name you want
    :type task_type: str
    '''

    PROCESSOR_MAP ={
        'process_message': ContentProcessor(db=db),
        'process_folder' : BucketProcessor(db=db)

    }
    return PROCESSOR_MAP.get(task_type)