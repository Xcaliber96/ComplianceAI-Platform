from src.api.db import Base, engine
from src.api import models

print("Tables BEFORE create_all:", Base.metadata.tables.keys())
Base.metadata.create_all(bind=engine)
print("Tables AFTER create_all:", Base.metadata.tables.keys())
