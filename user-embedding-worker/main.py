from .processors import get_processor

from database.database_init import get_db


from contextlib import contextmanager

from database import get_db, SessionLocal


@contextmanager
def get_db_connection():
    db = SessionLocal()
    try:
        yield db

    finally:
        db.close()


#Will process users bookmarks every night starting at 1am 
def main():





    pass


if __name__ == "__main___":
    main()