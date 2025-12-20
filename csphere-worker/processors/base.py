from abc import ABC, abstractmethod

from database import get_db
import logging
from data_models.content import Content
from utils.utils import handle_existing_content


logger = logging.getLogger(__name__)


class BaseProcessor(ABC):

    def __init__(self):
        self.db = get_db()
    @abstractmethod
    def process(self, payload: dict):
        """Standard method all processors must implement."""
        pass


    @staticmethod
    def get_db(self):
        '''
        Method to get the database instant 
        
        :param self: base
        '''
        db_gen = get_db()
        db = next(db_gen)
        return db 
    

    def extract_data(self, message:dict):
        '''
        Method to extract and return the data stored inside message
        
        :param message: data of the message 
        :type message: dict
        '''
        user_id = message.get('user_id')
        notes = message.get('notes')
        folder_id = message.get('folder_id', '')
        content_data = message.get('content_payload', {})


        if content_data == {}:
            logger.error("Content data is empty, returning")
            raise ValueError("Content data was empty, no content payload available")
        
        return (user_id, notes, folder_id, content_data)
    
    def handle_if_exists(self, content_url: str, user_id: int, notes:str, folder_id: int) -> bool :
        existing_content = self.db.query(Content).filter(Content.url == content_url).first()

        if existing_content:
            handle_existing_content(existing_content, user_id, self.db, notes, folder_id)
            logger.info("Bookmark succesfully saved to user")
            return True
        
        return False
        


