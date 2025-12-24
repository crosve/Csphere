import json
import requests

import os
from uuid import uuid4
from email.utils import quote
import time

from datetime import datetime, timezone
import logging

from data_models.content import Content
from data_models.content_item import ContentItem
from data_models.folder_item import folder_item
from data_models.content_ai import ContentAI
from database import get_db


from utils.utils import handle_existing_content, fetch_content

from dotenv import load_dotenv

from classes.EmbeddingManager import ContentEmbeddingManager

#Logging config stuff
logging.basicConfig(
    level=logging.DEBUG,   
    format='%(asctime)s - %(name)s - %(levelname)s - %(module)s - %(lineno)d - %(message)s'
)

logger = logging.getLogger(__name__)
logger.debug("This will show in the terminal")

load_dotenv()




def handle_message(message):


    db_gen = get_db()
    db = next(db_gen)

    logger.info(f"The current message: {message}")

 
    #Create the Content object 
    user_id = message.get('user_id')
    notes = message.get('notes')
    folder_id = message.get('folder_id', '')
    content_data = message.get('content_payload', {})

    #filter based on the content paylaod 


    if content_data == {}:
        logger.error("Content data is empty, returning")
        return 
    
    content_url = content_data.get('url')

    existing_content = db.query(Content).filter(Content.url == content_url).first()

    if existing_content:
        #done some logic and don't continue on , end it here 

        success = handle_existing_content(existing_content, user_id, db, notes, folder_id)
        if success:
            db.commit()
            logger.info("Bookmark succesfully saved to user")
        else:
            db.rollback()
            logger.error("Failed to save existing content bookmark.")
        return 
    

    new_content = Content(**content_data)
    
    try:
        db.add(new_content)
        db.flush()

        #update the content Embedding manager when necessary 
        content_manager = ContentEmbeddingManager(db=db, content_url=new_content.url)

        raw_html = message.get('raw_html')

        if not raw_html:
            raw_html = fetch_content(new_content.url)
            logging.info("No raw html provided, categorization and summarization may be poor")

        content_ai = content_manager.process_content(new_content, raw_html)

        if not content_ai:
            logger.info("Embedding generation failed or skipped.")
        else:
            logger.debug(f"Summary Generated: {content_ai.ai_summary}")

        # Check if this user already saved this content
        existing_item = db.query(ContentItem).filter(
            ContentItem.user_id == user_id,
            ContentItem.content_id == new_content.content_id
        ).first()


        utc_time = datetime.now(timezone.utc)

        if not existing_item:
            new_item = ContentItem(
                user_id=user_id,
                content_id=new_content.content_id,
                saved_at=utc_time,
                notes=notes
            )
            db.add(new_item)

            # Add to the corresponding folder if any
            if folder_id and folder_id != '' and folder_id != 'default':
                new_folder_item = folder_item(
                    folder_item_id=uuid4(),
                    folder_id=folder_id,
                    user_id=user_id,
                    content_id=new_content.content_id,
                    added_at=datetime.utcnow()
                )

                db.add(new_folder_item)
            else:
                logger.debug("No valid folder id found, skipping this part")

        db.commit()
        logger.info("Successfully saved content for user.")

    except Exception as e:
        db.rollback()
        logger.error(f"Error occurred while saving the bookmark: {str(e)}")

    


def poll_and_process():
    ACTIVEMQ_URL=os.getenv('ACTIVEMQ_URL')
    ACTIVEMQ_QUEUE= os.getenv('ACTIVEMQ_QUEUE')
    ACTIVEMQ_USER= os.getenv('ACTIVEMQ_USER')
    ACTIVEMQ_PASS= os.getenv('ACTIVEMQ_PASS')

    # ACTIVEMQ_URL='http://feeltiptop.com:8161/' 
    # ACTIVEMQ_QUEUE='CSPHEREQUEUETEST' 
    # ACTIVEMQ_USER='admin'
    # ACTIVEMQ_PASS='tiptop'


    queue_url = f"{ACTIVEMQ_URL}/api/message/{ACTIVEMQ_QUEUE}?type=queue&oneShot=true"

    while True:
        logging.info(f"Queue URL: {queue_url}")
        try:
            response = requests.get(queue_url, auth=(ACTIVEMQ_USER, ACTIVEMQ_PASS))
            if response.text or response.text != "":
                logging.info(f"Response status code: {response.status_code}")
                logging.info(f"Response text: {response.text}")
            
            # Check if the response is valid and not empty
            if response.status_code == 200 and response.text.strip():
                logging.info("Pulled succesfully")
                message = response.text.strip()

                logging.info(f"Received message form queue: {message}")

                try:
                    msg_json = json.loads(message)
                    logging.info(f"Message json: {msg_json}")
                    try:
                        #function to actually handle the message / bookmark
                        handle_message(msg_json)
                    except Exception as e:
                        logging.error(f"[ERROR] An error occurred in handle_message: {e} \n Message: {msg_json}")
                        # retryCount = msg.get('retryCount', 0) + 1
                        # msg['retryCount'] = retryCount

                        # if 'timestamp' not in msg:
                        #     msg['timestamp'] = datetime.now().isoformat()

                        # logger.info(f"[REQUEUE] Requeueing message: {msg}")
                        # if requeue_message(json.dumps(msg)):
                        #     logging.info(f"[REQUEUE] Message requeued successfully: {msg}")
                        # else:
                        #     logging.error(f"[REQUEUE ERROR] Failed to requeue message: {msg}, message will not be processed again")
                        
                        # requeue_message(msg_json)
                except json.JSONDecodeError:
                    logging.error(f"[ERROR] Failed to decode JSON: {message}")
            else:
                logging.info(f"No messages found in the queue")
            time.sleep(5)

        except Exception as e:
            logging.error(f"[ERROR] Polling error: {e}")
            time.sleep(5)


if __name__ == '__main__':
    logging.info("Polling process has started")
    #start of the polling process
    poll_and_process()

