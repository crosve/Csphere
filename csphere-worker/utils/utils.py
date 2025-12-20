from data_models.content import Content
from data_models.content_item import ContentItem
from data_models.folder_item import folder_item
from data_models.content_ai import ContentAI

import logging

from datetime import datetime, timezone
from uuid import uuid4





def handle_existing_content(existing_content, user_id: str, db, notes : str, folder_id) -> bool:

    try:

        existing_item = db.query(ContentItem).filter(
            ContentItem.user_id == user_id,
            ContentItem.content_id == existing_content.content_id
        ).first()


        utc_time = datetime.now(timezone.utc)

        if not existing_item:

            new_item = ContentItem(
                user_id=user_id,
                content_id=existing_content.content_id,
                saved_at=utc_time,  
                notes=notes ,

                read=False
            )
            db.add(new_item)
            db.commit()

            saved_item = db.query(ContentItem).order_by(ContentItem.saved_at.desc()).first()
            logging.info(f"Retrieved from DB: {saved_item.saved_at}")
         

            #add to the corresponding folder if any 

            if folder_id and folder_id != '' and folder_id != 'default':

                new_item = folder_item(
                    folder_item_id = uuid4(), 
                    folder_id = folder_id,
                    user_id = user_id, 
                    content_id = existing_content.content_id,
                    added_at = datetime.utcnow()

                )

                db.add(new_item)
                db.commit()
                db.refresh(new_item)
            else:
                logging.info("no valid fodler id found so skipping this part")
                

        logging.info("Successfully saved content for user.")

        return True





    except Exception as e:
        logging.error("issue offucred: ", str(e))

        return False 
    
