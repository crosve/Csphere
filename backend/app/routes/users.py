
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from sqlalchemy.orm import Session
from app.dependencies import get_current_user_id
from app.db.database import get_db
from app.schemas.user import UserCreate, UserSignIn, UserGoogleCreate, UserGoogleSignIn
from app.utils.hashing import get_password_hash, verify_password, create_access_token, get_current_user_id
from app.data_models.user import User
from app.core.settings import get_settings
from app.functions.AWS_s3 import extract_s3_key, get_presigned_url
from datetime import datetime
from uuid import uuid4
from uuid import UUID
import boto3
import logging
import os

from app.embeddings.embedding_manager import ContentEmbeddingManager

logger = logging.getLogger(__name__)


router = APIRouter(prefix="/user", tags=['user'])

settings = get_settings()
settings.BUCKET_NAME = settings.BUCKET_NAME


s3 = boto3.client(
    "s3",
    region_name="us-east-1",  
    aws_access_key_id=settings.AWS_ACCESS_KEY,
    aws_secret_access_key=settings.AWS_SECRET_KEY,
)

@router.post("/signup")
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    if not user:
        raise HTTPException(status_code=400, detail="Invalid user data")
    
    hashed_password = get_password_hash(user.password)
    logger.info(f"hashed password was sucesfuuly created: { hashed_password}")
    user.password = hashed_password

    # Check if user already exists by username
    existing_user = db.query(User).filter(User.username == user.username).first()
    if existing_user:
        logger.error(f"Username {user.username} already exists")
        raise HTTPException(status_code=400, detail="Username already registered")


    embedder = ContentEmbeddingManager(db=db)
    
    #Insert user into the database
    new_user = User(
        id=uuid4(),  # Generate UUID for the user
        username=user.username,
        email=user.email,
        password=user.password,
        created_at=datetime.utcnow() if not user.created_at else user.created_at,
        user_embedding=embedder._generate_embedding(text=f'initial embedding for user {user.username}'),
        last_embedding_update = datetime.utcnow() if not user.created_at else user.created_at
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)  # Refresh to get the user with the generated ID

    logger.info(f"user created succesfully for username {user.username}")
    presigned_url = ''
    if (new_user.profile_path != ''):
        presigned_url = get_presigned_url(new_user.profile_path)
    token =create_access_token(data={"sub": str(new_user.id), "email" : str(new_user.email), "username" : str(new_user.username), "profilePath" : presigned_url})
    

    return {'success': True, 'message': 'Google signup was succesful', 'token': token}


@router.post("/login")
def login(user: UserSignIn,  db: Session = Depends(get_db)):
    logger.info(f"Logging in user with user credentials: {user.username} and {user.password}")

    if not user:
        raise HTTPException(status_code=400, detail=f"Invalid user data. No username found for {user.username}")

    # Check if the user exists
    db_user = db.query(User).filter(User.username == user.username).first()
    if not db_user:
        logger.error(f"User not found with username {user.username}")
        raise HTTPException(status_code=400, detail="User not found")
    
   

    # Verify the password
    if not verify_password(user.password, db_user.password):
        logger.error(f"username and password do not match for user {user.username}")

        raise HTTPException(status_code=400, detail="Incorrect password")
    
    presigned_url = ''
    if db_user.profile_path != '' and db_user.profile_path != None:
        presigned_url = get_presigned_url(db_user.profile_path)
    token = create_access_token(data={"sub": str(db_user.id), "email" : str(db_user.email), "username" : str(db_user.username), "profilePath" : presigned_url})

    return {"username": db_user.username, "token": token}



from app.utils.token import Token
@router.get("/media/profile")
def get_profile_picture(profile_url: str = Query(...), user_id: UUID = Depends(get_current_user_id)):
    try:
        presigned_url = s3.generate_presigned_url(
        ClientMethod="get_object",
        Params={
            "Bucket": settings.BUCKET_NAME,
            "Key": extract_s3_key(profile_url)
        },
        ExpiresIn=3600  # seconds = 1 hour

    
        )

        logger.info(f"Presigned url created succesfully for user profile {profile_url}")

        #set a new cookie with this 

        token_obj = Token(user_id)

        new_jwt = token_obj.createAccessTokenWithUserId()

        logger.info("new presigned url successfully generated: ", new_jwt)


        
        return {'success' : True, "presigned_url": presigned_url, "jwt" : new_jwt}
    
    except Exception as e:
        logger.error(f"Error occured in creating the aws presigned url: {e}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Error occured in creating the aws presigned url: {e}",
        ) from e



@router.post("/media")
def upload_user_media(pfp: UploadFile = File(...), user_id: UUID = Depends(get_current_user_id), db: Session = Depends(get_db)):
    filename = f"pfps/{uuid4().hex}_{pfp.filename}"
    try:
        s3.upload_fileobj(
            pfp.file,
            settings.BUCKET_NAME,
            filename,
            ExtraArgs={
            
                "ContentType": pfp.content_type,
            },
        )

        image_url = f"https://{settings.BUCKET_NAME}.s3.amazonaws.com/{filename}"

        presigned_url = get_presigned_url(image_url)
        #save to the users DB 

        user = db.query(User).filter(User.id == user_id).first()

        if not user:
            return {'success': False, 'message': "no user found with the user_id"}
        
        user.profile_path = image_url
        token_obj = Token(user_id)

        new_jwt = token_obj.createAccessTokenWithUserId()
        db.commit()
    except Exception as e:
        return {'success' : False, 'error': str(e)}


    

    return {"success":True,"profile_media": presigned_url, "token" : new_jwt}




@router.post("/google/signup")
def google_signup(user: UserGoogleCreate,  db: Session = Depends(get_db)):

    try:
    #Check for existing user
        existing_user = db.query(User).filter(User.email == user.email and User.google_id == user.google_id).first()

        if existing_user:
            raise HTTPException(status_code=400, detail="Google account already registered")
        

        new_user = User(
            id=uuid4(),  # Generate UUID for the user
            username=user.username,
            email=user.email,
            password='',
            created_at=datetime.utcnow() ,
            google_id=user.google_id
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)  # Refresh to get the user with the generated ID
        presigned_url = ''
        if (new_user.profile_path != ''):
            presigned_url = get_presigned_url(new_user.profile_path)

        token = create_access_token(data={"sub": str(new_user.id), "email" : str(new_user.email), "username" : str(new_user.username), "profilePath" : presigned_url})

    except Exception as e:
        logger.error(f"Error occured with google signup for username : {user.username}, \n error: {e} " )
    






    return {'success': True, 'message': 'Google signup was succesful', 'token': token}





@router.post("/google/login")
def google_login(user : UserGoogleSignIn, db : Session =  Depends(get_db)):
    try:
        db_user = db.query(User).filter(user.google_id == User.google_id).first()
        if not db_user:
            raise HTTPException(status_code=400, detail="User not found")
        
        
        profile_path = ''
        if db_user.profile_path != None and db_user.profile_path != '':
            profile_path = get_presigned_url(db_user.profile_path)
        token = create_access_token(data={"sub": str(db_user.id), "email" : str(db_user.email), "username" : str(db_user.username), "profilePath" : str(profile_path)})

        return {'message' : 'user found', 'token' : token, 'success' : True}
    
    except Exception as e:

        logger.error(f"An error occured with the google login for user {user.google_id}: {e} ")



@router.post("/browser/login") # aliasing login from form via extension, generalizing the name to be cross-browser compatible
@router.post("/chrome/login")
def chrome_login(user: UserSignIn, db: Session = Depends(get_db)):
    try:
        if not user:
            raise HTTPException(status_code=400, detail="Invalid user data")

        # Check if the user exists
        db_user = db.query(User).filter(User.username == user.username).first()
        if not db_user:
            logger.error(f"User not found: {user.username}" )
            raise HTTPException(status_code=400, detail="User not found")
        

        # Verify the password
        if not verify_password(user.password, db_user.password):
            logger.error(f"Incorrect password for user: {user.username}")
            # If the password is incorrect, raise an HTTPException
            # This will return a 400 status code with the detail "Incorrect password"
            raise HTTPException(status_code=400, detail="Incorrect password")
        
        presigned_url = ''
        if db_user.profile_path != '' and db_user.profile_path != None:
            presigned_url = get_presigned_url(db_user.profile_path)
        token = create_access_token(data={"sub": str(db_user.id), "email" : str(db_user.email), "username" : str(db_user.username), "profilePath" : presigned_url})

        return {"username": db_user.username, "token": token, "detail" : 'sucessful login'}
    except Exception as e:
        logger.error(f"error occured in logging in user through the chrome interface {e}")
        raise HTTPException(status_code=400, detail=f"error occured in logging in user through the chrome interface {e}")



@router.post("/google")
def connect_google_account(user: UserGoogleCreate, user_id: UUID = Depends(get_current_user_id), db: Session = Depends(get_db)):
    try:
        google_id = user.google_id
        user = db.query(User).filter(User.id == user_id).first()

        if not user:
            return {"success" : False, "message" : "no user found for current user id"}
        
        user.google_id = google_id
        db.commit()
        return {"success" : True, "message" : "google ID connected for user"}
    
    except Exception as e:
        return {"success" : False, "message" : f"Following error occured: {e}"}
    




@router.get("/profile/info")
def get_user_info(user_id: UUID = Depends(get_current_user_id), db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.id == user_id).first()

        if not user:
            raise HTTPException(status_code=404, detail="User not found.")
        
        

        return {
            
            "username": user.username,
            "email": user.email,
            "profilePath" : get_presigned_url( user.profile_path) if user.profile_path != '' else ''
    
        }
    except Exception as e:
        logger.error(f"Error occured in fetching users profile info with userId: {user_id}")
        raise HTTPException(status_code=400, detail=f"Error fetching user profile info: {e}")

