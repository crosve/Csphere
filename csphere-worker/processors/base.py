from abc import ABC, abstractmethod
from sqlalchemy.orm import Session
from database import get_db
import logging
from data_models.content import Content
from utils.utils import handle_existing_content
from classes.EmbeddingManager import ContentEmbeddingManager

import asyncio
from playwright.async_api import async_playwright

import requests
logger = logging.getLogger(__name__)


class BaseProcessor(ABC):

    def __init__(self, db : Session):
        self.db = db
        self.embedding_manager = ContentEmbeddingManager(self.db)


    @abstractmethod
    def process(self, message: dict):
        """Standard method all processors must implement."""
        pass


    @staticmethod
    def get_db():
        '''
        Method to get the database instant 
        
        :param self: base
        '''
        db_gen = get_db()
        db = next(db_gen)
        return db 
    


    async def capture_page(self, url):
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page()

            print(f"Archiving: {url}...")
            
            # Go to the URL and wait until the network is idle
            await page.goto(url, wait_until="networkidle")

            text_content = await page.content() # Raw HTML
            # visible_text = await page.inner_text("body")


            return text_content
            
   

      

    def get_html_content(self, url: str) -> str:
        try:
            response = requests.get(url=url)
            if response.status_code == 200:
                # Get the HTML content as a string
                html_content = response.text
                return html_content
                
            else:
                logging.error(f"Failed to retrieve the page. Status code: {response.status_code}")

        except requests.exceptions.RequestException as e:
            logging.error(f"An error occurred: {e}")


        except Exception as e:
            logging.error(f"Error fetching the html content: {e}")

    def extract_data(self, message:dict):
        '''
        Method to extract and return the data stored inside message
        
        :param message: data of the message 
        :type message: dict
        '''
        user_id = message.get('user_id')
        notes = message.get('notes')
        folder_id = message.get('folder_id', '')
        raw_html = message.get('raw_html', '')
        content_data = message.get('content_payload', {})
        tag_ids = message.get('tag_ids', [])

        


        if content_data == {}:
            logger.error("Content data is empty, returning")
            raise ValueError("Content data was empty, no content payload available")
        
        # if raw_html == '':
        #     logging.info("No raw html was provided, fetching raw html now")

        #     raw_html = self.get_html_content(url=content_data.get('url'))
        
        return (user_id, notes, folder_id, raw_html, content_data, tag_ids)
    
    def handle_if_exists(self, content_url: str, user_id: int, notes:str, folder_id: int, tag_ids: list[str]) -> str :
        existing_content : Content = self.db.query(Content).filter(Content.url == content_url).first()

        if existing_content:
            handle_existing_content(existing_content, user_id, self.db, notes, folder_id, tag_ids)
            logger.info("Bookmark succesfully saved to user")
            return existing_content.content_id
        
        return ''
        


