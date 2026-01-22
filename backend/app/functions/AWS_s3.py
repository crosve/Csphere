from app.core.settings import get_settings
from urllib.parse import urlparse
import os
import boto3


settings = get_settings()
BUCKET_NAME = settings.BUCKET_NAME


s3 = boto3.client(
    "s3",
    region_name="us-east-1",  # change this to your S3 region
    aws_access_key_id=settings.AWS_ACCESS_KEY,
    aws_secret_access_key=settings.AWS_SECRET_KEY,
)

def extract_s3_key(s3_url: str) -> str:
    parsed = urlparse(s3_url)
    # parsed.path is like '/pfps/58b59edcb9034a9db9a488185f56d5af_pixil-frame-0.png'
    return parsed.path.lstrip('/')  # Remove leading slash


def get_presigned_url(profile_url: str) -> str:
    
    presigned_url = s3.generate_presigned_url(
    ClientMethod="get_object",
    Params={
        "Bucket": BUCKET_NAME,
        "Key": extract_s3_key(profile_url)
    },
    ExpiresIn=3600  # seconds = 1 hour
    )      
    return  presigned_url