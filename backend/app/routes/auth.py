from fastapi import APIRouter, Depends,  HTTPException, status
from fastapi.responses import RedirectResponse, JSONResponse
from app.db.database import get_db
from app.data_models.user import User
from app.functions.AWS_s3 import  get_presigned_url
from app.core.settings import get_settings
from app.utils.hashing import create_access_token
from sqlalchemy.orm import Session
from urllib.parse import urlencode
import logging
import httpx
import os

logger = logging.getLogger(__name__) 

settings = get_settings()

S3_BUCKET_NAME = settings.S3_BUCKET_NAME
GOOGLE_REDIRECT_URI = settings.GOOGLE_REDIRECT_URI
GOOGLE_CLIENT_ID = settings.GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET = settings.GOOGLE_CLIENT_SECRET


router = APIRouter(
    prefix="/auth"
)


#implement CSRF when you get the chance
@router.get("/google", status_code=status.HTTP_307_TEMPORARY_REDIRECT)
def handle_google_session():

    try:
        if not GOOGLE_CLIENT_ID or not GOOGLE_REDIRECT_URI:
            raise HTTPException(
                status_code = status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail = 'google client id or redirect url was not found',
            )
        params = {
            "client_id": GOOGLE_CLIENT_ID,
            "redirect_uri": GOOGLE_REDIRECT_URI,
            "response_type": "code",
            "scope": "openid email profile",
            "access_type": "offline",
            "prompt": "consent"
        }
        google_auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
        return RedirectResponse(google_auth_url)
    
    except Exception as e:
        logger.error(f"OAuth Initiation Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service temporarily unavailable"
        )
    


@router.post("/google/callback")
async def handle_google_callback(
    payload: dict, 
    db: Session = Depends(get_db)
):
    code = payload.get('code')

    if not code:
        return JSONResponse({"error": "No code provided"}, status_code=400)

    # Exchange code for tokens
    token_url = "https://oauth2.googleapis.com/token"
    token_data = {
        "code": code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code",
    }

    async with httpx.AsyncClient() as client:
        token_response = await client.post(token_url, data=token_data)
        token_json = token_response.json()
        access_token = token_json.get("access_token")

    if not access_token:
        return JSONResponse({"error": "No access token returned"}, status_code=400)

    # Get user info from Google
    async with httpx.AsyncClient() as client:
        user_info_response = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        user_info = user_info_response.json()

    print("User Info:", user_info)


    google_user_id = user_info.get("id") 

    if not google_user_id:
        return JSONResponse({"error": "Invalid user info"}, status_code=400)

    user = db.query(User).filter(User.google_id == google_user_id).first()

    if not user:
        return JSONResponse({"error": "User not found"}, status_code=404)

    presigned_url = ""
    if user.profile_path:
        presigned_url = get_presigned_url(user.profile_path)

    # Generate token
    token = create_access_token(data={
        "sub": str(user.id),
        "email": user.email,
        "username": user.username,
        "profilePath": presigned_url
    })

    # Redirect to Chrome Extension with token
    return  {"token": token}