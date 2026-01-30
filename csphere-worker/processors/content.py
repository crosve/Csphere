from .base import BaseProcessor
import logging
from data_models.content import Content
from sqlalchemy.orm import Session

from datetime import datetime, timezone
from data_models.content_item import ContentItem
from classes.EmbeddingManager import ContentEmbeddingManager
from data_models.folder_item import folder_item
from data_models.content_tag import ContentTag

from uuid import uuid4


logger = logging.getLogger(__name__)


class ContentProcessor(BaseProcessor):


    def __init__(self, db:Session):
        super().__init__(db=db)


    #Message now has the tag_ids we need to connect 
    def process(self, message: dict) -> str:

        user_id, notes, folder_id, _, content_data, tag_ids = self.extract_data(message=message)

        content_url = content_data.get('url')

        existing_content_id = self.handle_if_exists(content_url, user_id, notes, folder_id, tag_ids)

        if existing_content_id != '':
            logger.info('Content existed and was saved appropriately')
            return existing_content_id
        
        new_content : Content = Content(**content_data)

        try:
            self.db.add(new_content)
            self.db.flush()

            utc_time = datetime.now(timezone.utc)

            # Ensure the user-content relationship exists even if AI processing fails.
            existing_item = self.db.query(ContentItem).filter(
                ContentItem.user_id == user_id,
                ContentItem.content_id == new_content.content_id
            ).first()

            if not existing_item:
                new_item = ContentItem(
                    user_id=user_id,
                    content_id=new_content.content_id,
                    saved_at=utc_time,
                    notes=notes,
                )
                self.db.add(new_item)

            #update the content Embedding manager when necessary 
            content_manager = ContentEmbeddingManager(db=self.db, content_url=new_content.url)

            raw_html = message.get('raw_html', '')

            if not raw_html or raw_html == '':
                logging.info("No raw html provided, categorization and summarization may be poor")
                raw_html = self.capture_page(url=content_url)

                #confirm the raw html was fetched

                if not raw_html or raw_html == '':
                    logging.warning(f"No raw HTML was fetched for the following url: {raw_html}")

            content_ai = content_manager.process_content(new_content, raw_html)

            self.db.commit()

            if not content_ai:
                logging.info("Embedding generation failed or skipped.")
            else:
                logging.debug(f"Summary Generated: {content_ai.ai_summary}")

            # Add to the corresponding folder if any
            if folder_id and folder_id != '' and folder_id != 'default':
                new_folder_item = folder_item(
                    folder_item_id=uuid4(),
                    folder_id=folder_id,
                    user_id=user_id,
                    content_id=new_content.content_id,
                    added_at=datetime.utcnow(),
                )

                self.db.add(new_folder_item)
                self.db.commit()
                self.db.refresh(new_folder_item)
            else:
                print("No valid folder id found, skipping this part")

            if tag_ids:
                for tag_id in tag_ids:
                    existing_tag_link = self.db.query(ContentTag).filter(
                        ContentTag.c.tag_id == tag_id,
                        ContentTag.c.content_id == new_content.content_id,
                        ContentTag.c.user_id == user_id,
                    ).first()

                    if not existing_tag_link:
                        stmt = ContentTag.insert().values(
                            tag_id=tag_id,
                            content_id=new_content.content_id,
                            user_id=user_id,
                        )
                        self.db.execute(stmt)
                self.db.commit()

            logging.info(f"Successfully saved content for user. Returning content id: {new_content.content_id}")
            return new_content.content_id

        except Exception as e:
            self.db.rollback()
            logging.error(f"Error occurred while saving the bookmark: {str(e)}")
            return ''
            
        
