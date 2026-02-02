import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL.startswith('postgres://'):
    DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)
print("DB URL: ", DATABASE_URL)

try:
    engine = create_engine(DATABASE_URL, connect_args={
        "options": "-c timezone=UTC"
    })
    print("Connected")
except Exception as e:
    print("Connection falied: ", e)

# managing transactions and DB state
SessionLocal = sessionmaker(bind=engine)

#Initialize the base for all datamodels
Base = declarative_base()

# yield a fresh session per request (FASTAPI)
def get_db():
    print("Creating new session")
    # session instance
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

from data_models import content, content_ai, content_item, user, folder, folder_item, content_tag, tag, content_category
