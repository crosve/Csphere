from .content import ContentProcessor

PROCESSOR_MAP ={
    'process_message': ContentProcessor
    
}


def get_processor(task_type: str):
    return PROCESSOR_MAP.get(task_type)