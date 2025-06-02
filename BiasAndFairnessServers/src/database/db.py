import dotenv
dotenv.load_dotenv()

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings
from contextlib import contextmanager

engine = create_engine(settings.sqlalchemy_database_url)

SessionLocal = sessionmaker(bind=engine)

Base = declarative_base()

@contextmanager
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
