from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.dependencies import get_current_user_id
from app.data_models.folder import Folder
from app.data_models.folder_item import folder_item
from sqlalchemy import desc, func, delete
from app.data_models.content import Content
from app.data_models.content_item import ContentItem
from app.data_models.content_ai import ContentAI

from app.services.folder import update_folder_metadata, create_user_folder, addItemToFolder

from app.db.database import get_db
from app.schemas.folder import  FolderDetails, FolderItem, FolderMetadata
from app.exceptions.folder import FolderNotFound

from app.utils.hashing import get_current_user_id
from datetime import datetime
from uuid import uuid4
from uuid import UUID
import logging



router = APIRouter(
    tags=['folder'],
)

logger = logging.getLogger(__name__) 



@router.get("/folder")
def get_folders( user_id: UUID=Depends(get_current_user_id), db:Session = Depends(get_db)):

    try:

        
 
        folders= db.query(Folder).filter(Folder.user_id == user_id and Folder.folder_id == Folder.parent_id ).order_by(desc(Folder.created_at)).all()


        res = []

        for folder in folders:
            file_count = db.query(func.count(folder_item.folder_id)).filter(folder_item.folder_id == folder.folder_id).scalar()
            folder_data = {
                "folderId" : folder.folder_id, 
                "createdAt" : folder.created_at, 
                "folderName": folder.folder_name,
                "parentId": folder.folder_id, 
                "fileCount": file_count

            }
            res.append(folder_data)

        return {'success' : True, 'data' : res}
    except Exception as e:
        return {'success' : False, 'error' : str(e)}





@router.get("/folder-path/{folder_id}")
def get_folder_path(folder_id: UUID, user_id: UUID=Depends(get_current_user_id), db: Session = Depends(get_db)):
    path = []
    current = db.query(Folder).filter(Folder.folder_id == folder_id, Folder.user_id == user_id).first()
    while current:
        path.insert(0, {"name": current.folder_name, "id": str(current.folder_id)})
        if not current.parent_id or current.parent_id == current.folder_id:
            break
        current = db.query(Folder).filter(Folder.folder_id == current.parent_id, Folder.user_id == user_id).first()
    return {"path": path}


@router.get('/folder/metadata/{folder_id}')
def get_folder_metadata(folder_id : str, db: Session = Depends(get_db)):

    try:
        folder : Folder = db.query(Folder).filter(Folder.folder_id ==folder_id ).first()
        if not folder:
            return {'success' : False, 'message' : 'No folder found for this folder id '}
        
        payload = {
            "name" : folder.folder_name if not None else '', 
            "keywords" : folder.keywords if not None else [],
            "urlPatterns" : folder.url_patterns if not None else [], 
            "description" : folder.description if not None else '',
            "smartBucketingEnabled" : folder.bucketing_mode if not None else False

        }

        return {'success'  : True, 'message': 'Data fetched successfully', 'data' : payload }


    except Exception as e:
        logging.error(f"Error occured trying to fet folder metadata: {e} ")


from sqlalchemy.exc import SQLAlchemyError


@router.put("/folder/{folder_id}")
def process_folder_metadata(
    folder_id: UUID,
    metadata: FolderMetadata,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    try:
        logging.info(f"Folder metdata being processed: {metadata}")
        folder = update_folder_metadata(
            db=db,
            folder_id=folder_id,
            user_id=user_id,
            metadata=metadata,
        )
        return {"success": True, "folder_id": folder.folder_id}

    except FolderNotFound:
        raise HTTPException(status_code=404, detail="Folder not found")
    




    





@router.get("/folder/{folder_id}")
def get_folder_items(
    folder_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    print("current folder id: ", folder_id)
    folder_bookmarks = (
        db.query(Content, ContentItem.notes, ContentItem.saved_at, ContentAI.ai_summary)
        .join(folder_item, folder_item.content_id == Content.content_id)
        .join(ContentItem, (ContentItem.content_id == Content.content_id) & (ContentItem.user_id == user_id))
        .outerjoin(ContentAI, ContentAI.content_id == Content.content_id)  # AI is optional
        .filter(folder_item.folder_id == folder_id)
        .filter(folder_item.user_id == user_id)
        .order_by(desc(Content.first_saved_at))
        .all()
    )

    print("folder_id:", folder_id, "| results:", folder_bookmarks)

    return [
        {
            "content_id": content.content_id,
            "url": content.url,
            "title": content.title,
            "source": content.source,
            "ai_summary": ai_summary,
            "first_saved_at": saved_at,
            "notes": notes,
        }
        for content, notes, saved_at, ai_summary in folder_bookmarks
    ]


#change to PUT router later
@router.post("/users/folder/add")
def add_to_folder(itemDetails: FolderItem, user_id: UUID=Depends(get_current_user_id), db: Session = Depends(get_db)):

    #make sure item isn't already in the DB

    try:

        res = addItemToFolder(db=db, user_id=user_id, folder_id=itemDetails.folderId, itemDetails=itemDetails)
        if res.get('success', False):
            logging.info(f'Succesfully inserted item to folder')
        else:
            logging.warning(f"Something went wrong, Check out the logic ")

        return res

    # present = db.query(folder_item).filter(itemDetails.contentId == folder_item.content_id, itemDetails.folderId == folder_item.folder_id, user_id == folder_item.user_id).first()

    # if present:
    #     raise HTTPException(status_code=400, detail="Item already in the folder")
    
    # try:
    #     new_item = folder_item(
    #         folder_item_id = uuid4(), 
    #         folder_id = itemDetails.folderId,
    #         user_id = user_id, 
    #         content_id = itemDetails.contentId,
    #         added_at = datetime.utcnow()

    #     )

    #     db.add(new_item)
    #     db.commit()
    #     db.refresh(new_item)

    #     return {'success' : True, 'message' : 'Bookmark added to folder'} 


    except Exception as e:
        logging.error(f"Error occured trying to add the item to the folder: {e}")
        return {'success': False, 'message' : str(e)} 
    


@router.get("/users/folders")
def get_users_folders( user_id: UUID=Depends(get_current_user_id), db: Session = Depends(get_db)):
    #this api only gets folders that have no parwsnts
    usersFolders = db.query(Folder).filter(Folder.user_id == user_id, Folder.folder_id == Folder.folder_id).all()

    if not usersFolders:
        return {'success' : True, 'data' : []}
    

    #process the data
    res = []
    for folder in usersFolders:
        data = {
            "folder_id": folder.folder_id,
            "folder_name": folder.folder_name

        }
        res.append(data)
    

    print("all folders for current user: ", usersFolders)

    return {'success' : True, 'data' : res}


#Edit the api endpoint protocol later
@router.post("/user/folder/create")
def create_folder(folderDetails: FolderDetails, user_id: UUID=Depends(get_current_user_id), db: Session = Depends(get_db)):

    try:
        folder_creation_details = create_user_folder(db=db, folderDetails=folderDetails, user_id=user_id)

        return folder_creation_details


    except Exception as e:
        logging.error(f"failed to create user folder: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create folder: {e}")

    # print("folder details: ", folderDetails)

    # #check for existing folders with the same name under the same user_id
    # duplicates = db.query(Folder).filter(
    # Folder.user_id == user_id,
    # Folder.folder_name == folderDetails.foldername
    #     ).all()
    # print(f"Found {len(duplicates)} folders with same name and user.")

    # if duplicates:
    #     print("folder already exists: ", duplicates)
    #     raise HTTPException(status_code=400, detail="Folder already exists") 
    
    # folder_uuid = uuid4()
    
    # try:
    #     new_folder = Folder(
    #         folder_id = folder_uuid,
    #         user_id= user_id, 
    #         parent_id = folderDetails.folderId if folderDetails.folderId else folder_uuid,
    #         folder_name = folderDetails.foldername,
    #         bucketing_mode = False, 
    #         keywords = [], 
    #         url_patterns = [],
    #         description='',
    #         created_at=datetime.utcnow() 
    #     )
    #     db.add(new_folder)
    #     db.commit()
    #     db.refresh(new_folder)
        

    #     folder_details = {
    #         'folder_id' : new_folder.folder_id,
    #         'created_at' : new_folder.created_at, 
    #         'folder_name' : new_folder.folder_name,
    #         'parent_id' : new_folder.parent_id,
    #         'file_count' : 0

    #     }

    #     return {'success' : True, 'message' : 'folder created successfully', 'folder_details': folder_details}


    # except Exception as e:
    #     logging.error(f"Failed to create folder for user: {e}")
    #     return {'success' : False, 'message' : str(e)}


@router.delete("/folder/{folder_id}")
def deleteFolder(folder_id: UUID, user_id: UUID=Depends(get_current_user_id), db: Session = Depends(get_db)):
    
    try:
        #make sure the folder_id exists 
        exist = db.query(Folder).filter(
                Folder.user_id == user_id,
                Folder.folder_id == folder_id
                    ).first()
        
        if not exist:
            logger.error(f"Folder with folder id {folder_id} does not exist ")
            return {'success' : False, 'message' : "Folder does not exists"}
        
        db.delete(exist)


        db.commit()

        logger.info(f"Folder id {folder_id} was deleted")

        return {'success' : True, 'message' : "folder was deleted successfully"}
        


    


    except Exception as e:

        return {'success' : False, 'message' : str(e)}
        
