from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

Base = declarative_base()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./complianceai.db")
print("DB file path:", os.path.abspath(DATABASE_URL.split('///')[-1]))
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ====== THIS MUST BE LAST GLOBAL IMPORT! ======
from src.api import models

# Print table dict before/after table creation
print("Tables BEFORE create_all:", Base.metadata.tables.keys())
Base.metadata.create_all(bind=engine)
print("Tables AFTER create_all:", Base.metadata.tables.keys())
from sqlalchemy import Column, Integer

class _Test(Base):
    __tablename__ = "test_table"
    id = Column(Integer, primary_key=True)

