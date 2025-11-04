# reset_db.py
from src.api.db import Base, engine

# Caution: THIS DELETES ALL EXISTING DATA in your tables!
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)
print("Database tables dropped and recreated.")
