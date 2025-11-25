from datetime import datetime
from src.api.models import FileExtraction

def save_extraction(db, file_id: str, user_uid: str, extraction_json: dict):
    """
    Saves or updates extracted metadata for a file.
    """

    existing = (
        db.query(FileExtraction)
        .filter(FileExtraction.file_id == file_id)
        .filter(FileExtraction.user_uid == user_uid)
        .first()
    )

    if existing:
        existing.extraction = extraction_json
        existing.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return existing

    new_extraction = FileExtraction(
        file_id=file_id,
        user_uid=user_uid,
        extraction=extraction_json
    )

    db.add(new_extraction)
    db.commit()
    db.refresh(new_extraction)

    return new_extraction
