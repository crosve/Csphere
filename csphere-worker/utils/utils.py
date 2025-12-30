from data_models.content import Content
from data_models.content_item import ContentItem
from data_models.folder_item import folder_item
from data_models.content_ai import ContentAI

import logging

from datetime import datetime, timezone
from uuid import uuid4





def handle_existing_content(existing_content, user_id: str, db, notes: str, folder_id: str) -> bool:
    try:
        utc_now = datetime.now(timezone.utc)
        content_id = existing_content.content_id


        existing_item = db.query(ContentItem).filter(
            ContentItem.user_id == user_id,
            ContentItem.content_id == content_id
        ).first()

        if not existing_item:
            new_item = ContentItem(
                user_id=user_id,
                content_id=content_id,
                saved_at=utc_now,  
                notes=notes,
                read=False
            )
            db.add(new_item)
        else:
            existing_item.notes = notes
            existing_item.saved_at = utc_now


        if folder_id and folder_id not in ['', 'default', 'none']:
            
       
            already_in_folder = db.query(folder_item).filter(
                folder_item.folder_id == folder_id,
                folder_item.content_id == content_id,
                folder_item.user_id == user_id
            ).first()

            if not already_in_folder:
                new_folder_link = folder_item(
                    folder_item_id=uuid4(), 
                    folder_id=folder_id,
                    user_id=user_id, 
                    content_id=content_id,
                    added_at=utc_now
                )
                db.add(new_folder_link)
                logging.info(f"Assigned content {content_id} to folder {folder_id}")
            else:
                logging.info(f"Content {content_id} is already in folder {folder_id}, skipping link creation.")


        db.commit()
        logging.info("Successfully processed existing content and folder assignment.")
        return True

    except Exception as e:
        db.rollback() # Roll back changes if any part of the save fails
        logging.error(f"Issue occurred in handle_existing_content: {str(e)}")
        return False
    
