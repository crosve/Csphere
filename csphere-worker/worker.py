import json
import requests

import os
from uuid import uuid4
from email.utils import quote
import time

import logging


from dotenv import load_dotenv


from processors import get_processor
from processors.bucket import BucketProcessor
from processors.content import ContentProcessor
from processors.web import WebParsingProcessor
from schemas.content_schemas import MessageSchema

from contextlib import contextmanager

from database import SessionLocal

@contextmanager
def get_db_connection():
    db = SessionLocal()
    try:
        yield db

    finally:
        db.close()


#Logging config stuff
logging.basicConfig(
    level=logging.DEBUG,   
    format='%(asctime)s - %(name)s - %(levelname)s - %(module)s - %(lineno)d - %(message)s'
)

logger = logging.getLogger(__name__)
logger.debug("This will show in the terminal")

load_dotenv()


def handle_message(message : dict, pydantic_message : MessageSchema):

    #
    try:

        with get_db_connection() as db:
            print('here 1')
            messageProcessor : ContentProcessor = get_processor('process_message', db )
            logging.info("got the processor")
            content_id : str = messageProcessor.process(message=message)

            logging.info(f'content id returned after processing message: {content_id}')

            print('here')

            #only process if there is no folder id
            if content_id != '' and pydantic_message.folder_id in ['default',None, '']:
                logging.info('processing the content for folders')
                bucketProcessor : BucketProcessor = get_processor('process_folder', db=db)
                bucketProcessor.process(message=message, content_id=content_id)

            if content_id != '':
                webProcessor : WebParsingProcessor = get_processor('process_webpage', db=db)
                logging.info(f"Processing following url and saving to content table: {pydantic_message.content_payload.url}")
                webProcessor.process(content_id=content_id, url=pydantic_message.content_payload.url)

    except Exception as e:
        logging.error(f"Failed to fully process message: {e}")



    


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
                    #Validate the message JSON 
                    pydantic_msg = MessageSchema(**msg_json)
                    logging.info(f"Message json: {msg_json}")
                    logging.info(f"Pydantic message: {pydantic_msg}")
                    try:
                        #function to actually handle the message / bookmark
                        handle_message(msg_json, pydantic_msg)
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

