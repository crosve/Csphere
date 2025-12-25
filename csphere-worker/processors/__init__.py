from .content import ContentProcessor
from .bucket import BucketProcessor

PROCESSOR_MAP ={
    'process_message': ContentProcessor(),
    'process_folder' : BucketProcessor()

}


def get_processor(task_type: str):
    '''
    Returns the processor based on task_type
    Possible task_types to input:
        process_message
        process_folder
    
    :param task_type: processor key name you want
    :type task_type: str
    '''
    return PROCESSOR_MAP.get(task_type)