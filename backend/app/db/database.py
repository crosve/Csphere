
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.settings import get_settings

settings = get_settings()

try:
    engine = create_engine(
        settings.DATABASE_URL, connect_args={
        "options": "-c timezone=UTC"
    })
    print("Connected")
except Exception as e:
    print("Connection falied: ", e)


SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

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

