from .base import BaseProcessor
import logging
from data_models.content import Content

from datetime import datetime, timezone
from data_models.content_item import ContentItem
from classes.EmbeddingManager import ContentEmbeddingManager
from data_models.folder_item import folder_item

from uuid import uuid4
import time


logger = logging.getLogger(__name__)