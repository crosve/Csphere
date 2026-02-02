from processors import get_processor
from processors.user_embedding import UserEmbeddingProcessor

from contextlib import contextmanager

from database.database import SessionLocal




#Logging configs 
import logging
import traceback

logging.basicConfig(
    level=logging.DEBUG,   
    format='%(asctime)s - %(name)s - %(levelname)s - %(module)s - %(lineno)d - %(message)s'
)

logger = logging.getLogger(__name__)


@contextmanager
def get_db_connection():
    db = SessionLocal()
    try:
        yield db

    finally:
        db.close()

#Will process users bookmarks every night starting at 1am 
def main():


    try:
        with get_db_connection() as db:
            #Use the first processor(embedding)
          
            logging.info("Starting user embedding updates")

            embedding_processor : UserEmbeddingProcessor = get_processor('process_embedding', db)

            total_users_processed = embedding_processor.process_users_embeddings()

            logging.info(f"processed all ${total_users_processed} users")
            return

            




    except Exception as e:
        logging.exception("Detailed stack trace of the failure:")



if __name__ == "__main__":
    print("here")
    main()