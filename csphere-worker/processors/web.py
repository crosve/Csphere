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

from urllib.parse import urlparse

import os 
import subprocess
import boto3
from core.settings import get_settings

from fake_useragent import UserAgent

logger = logging.getLogger(__name__)


settings = get_settings()


class WebParsingProcessor(BaseProcessor):
    def __init__(self, db: Session):
        super().__init__(db)
        self.s3 = boto3.client(
            "s3",
            region_name="us-east-1",  
            aws_access_key_id=settings.AWS_ACCESS_KEY,
            aws_secret_access_key=settings.AWS_SECRET_KEY,
        )
        self.bucket_name = settings.BUCKET_NAME

    def process(self, content_id: str, url: str):
        """
        Orchestrates the archival, upload, and DB update.
        """
        # 1. Create a unique identifier for this snapshot
        unique_id = f"{content_id}_{uuid4().hex}"
        local_filename = f"{unique_id}.html"
        
        # 2. Capture the page locally
        local_path = self.archive_page(url, unique_id)
        
        if not local_path or not os.path.exists(local_path):
            logger.error(f"Failed to archive page for content_id: {content_id}")
            return False

        try:
            # 3. Upload to S3
            s3_key = f"archives/{content_id}/{local_filename}"
            s3_url = self.save_to_s3(local_path, s3_key)

            if s3_url:
                content_item : Content = self.db.query(Content).filter(Content.content_id == content_id).first()
                if content_item:
                    # Assuming you have a field to store the permanent link
                    content_item.html_content_url = s3_url 
                    self.db.commit()
                    logger.info(f"Successfully processed and linked archive for {content_id}")
            
            return True

        finally:
            if os.path.exists(local_path):
                os.remove(local_path)

    def archive_page(self, url, filename):
        if not url.startswith("http"):
            url = "https://" + url

        output_dir = "temp_archives"
        os.makedirs(output_dir, exist_ok=True)
        output_path = os.path.abspath(os.path.join(output_dir, f"{filename}.html"))

        ua = UserAgent(browsers=['chrome', 'edge'], os=['macos', 'windows'])
        random_ua = ua.random

        command = [
            "npx",
            "single-file-cli",
            url,
            output_path,
            "--browser-args",
            (
                f"--no-sandbox "
                f"--disable-setuid-sandbox "
                f"--disable-gpu "
                f"--disable-dev-shm-usage "
                f"--user-agent={random_ua} "
                f"--disable-blink-features=AutomationControlled"
            ),
        ]


        logger.info(f"Archiving following url: {url}")
        try:
            result = subprocess.run(command, capture_output=True, text=True, timeout=120)
            logger.error(f"SingleFile stdout: {result.stdout}") 
            logger.error(f"SingleFile stderr: {result.stderr}")
            logger.error(f"SingleFile return code: {result.returncode}")


            if result.returncode == 0 and os.path.exists(output_path):
                return output_path
            logger.error(f"SingleFile Error: {result.stderr}")
        except Exception as e:
            logger.error(f"Archive subprocess failed: {e}")
        return None

    def save_to_s3(self, local_path, s3_key):
        """
        Uploads the file with proper Content-Type so it renders in browser.
        """
        try:
            self.s3.upload_file(
                local_path, 
                self.bucket_name, 
                s3_key,
                ExtraArgs={
                    "ContentType": "text/html",
                }
            )
            # Construct the base S3 URL (you'll use your pre-signed method to view it)
            return f"https://{self.bucket_name}.s3.amazonaws.com/{s3_key}"
        except Exception as e:
            logger.error(f"S3 Upload failed: {e}")
            return None

    def extract_s3_key(self, s3_url: str) -> str:
        parsed = urlparse(s3_url)
        return parsed.path.lstrip('/')

    def get_presigned_url(self, archive_url: str) -> str:
        """
        Generates a URL for the frontend to put into an <iframe>.
        """
        return self.s3.generate_presigned_url(
            ClientMethod="get_object",
            Params={
                "Bucket": self.bucket_name,
                "Key": self.extract_s3_key(archive_url)
            },
            ExpiresIn=3600
        )