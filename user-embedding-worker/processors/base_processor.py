import logging
from uuid import uuid4
import re
import numpy as np
from datetime import datetime, timezone
from typing import List, Tuple, Optional


from abc import ABC, abstractmethod


from sqlalchemy.orm import Session

from rapidfuzz import fuzz

# Using pgvector specific functions if available in your SQLAlchemy setup
from sqlalchemy import func


class BaseProcessor(ABC):
    def __init__(self, db: Session):
        self.db : Session = db
