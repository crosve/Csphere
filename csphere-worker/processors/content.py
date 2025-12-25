from .base import BaseProcessor
import logging
from data_models.content import Content

from datetime import datetime, timezone
from data_models.content_item import ContentItem
from classes.EmbeddingManager import ContentEmbeddingManager
from data_models.folder_item import folder_item

from uuid import uuid4


logger = logging.getLogger(__name__)


class ContentProcessor(BaseProcessor):


    def __init__(self):
        super().__init__()


    def process(self, message: dict):

        user_id, notes, folder_id, content_data = self.extract_data(message=message)

        content_url = content_data.get('url')

        if self.handle_if_exists(content_url, user_id, notes, folder_id):
            logger.info('Content existed and was saved appropiatly')
            return 
        
        new_content = Content(**content_data)

        try:
            self.db.add(new_content)
            self.db.flush()

            #update the content Embedding manager when necessary 
            content_manager = ContentEmbeddingManager(db=self.db, content_url=new_content.url)

            raw_html = message.get('raw_html', '')

            if raw_html == '':
                logging.info("No raw html provided, categorization and summarization may be poor")

            content_ai = content_manager.process_content(new_content, raw_html)

            self.db.commit()

            if not content_ai:
                logging.info("Embedding generation failed or skipped.")
            else:
                logging.debug(f"Summary Generated: {content_ai.ai_summary}")

                # Check if this user already saved this content
                existing_item = self.db.query(ContentItem).filter(
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
                    self.db.add(new_item)
                    self.db.commit()


                    # Add to the corresponding folder if any
                    if folder_id and folder_id != '' and folder_id != 'default':
                        new_folder_item = folder_item(
                            folder_item_id=uuid4(),
                            folder_id=folder_id,
                            user_id=user_id,
                            content_id=new_content.content_id,
                            added_at=datetime.utcnow()
                        )

                        self.db.add(new_folder_item)
                        self.db.commit()
                        self.db.refresh(new_folder_item)
                    else:
                        print("No valid folder id found, skipping this part")

                logging.info("Successfully saved content for user.")

        except Exception as e:
            logging.error(f"Error occurred while saving the bookmark: {str(e)}")
            
        
