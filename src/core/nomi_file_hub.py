import os
import json
import uuid
from datetime import datetime

# This will create a folder NEXT TO main_api.py:
#    /ComplianceAI-Platform/filehub_uploads/
FILEHUB_DIR = os.path.abspath("filehub_uploads")
os.makedirs(FILEHUB_DIR, exist_ok=True)

def get_user_folder(user_uid: str):
    """Return the folder path for a user (and create it if missing)."""
    folder = os.path.join(FILEHUB_DIR, f"user_{user_uid}")
    os.makedirs(folder, exist_ok=True)
    return folder


def get_user_index_file(user_uid: str):
    """Return the JSON index file for this user."""
    return os.path.join(FILEHUB_DIR, f"filehub_index_{user_uid}.json")


def load_index(user_uid: str):
    """Load all metadata for a user's files."""
    index_file = get_user_index_file(user_uid)

    if os.path.exists(index_file):
        try:
            with open(index_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []

    return []


def save_index(user_uid: str, data):
    """Save metadata list to disk."""
    index_file = get_user_index_file(user_uid)
    with open(index_file, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)

def save_user_file(
    file_bytes: bytes,
    filename: str,
    user_uid: str,
    
    file_type: str,
    used_for: str,
    department: str
):

    """
    Saves a file AND stores metadata.

    Metadata fields:
      - id
      - original_name
      - stored_name
      - uploaded_at
      - file_type
      - used_for
    """

    folder = get_user_folder(user_uid)
    file_id = str(uuid.uuid4())
    stored_name = f"{file_id}_{filename}"
    stored_path = os.path.join(folder, stored_name)
    # Save file to disk
    with open(stored_path, "wb") as f:
        f.write(file_bytes)

    # Build metadata
    entry = {
        "id": file_id,
        "user_uid": user_uid,   
        "original_name": filename,
        "stored_name": stored_name,
        "size": len(file_bytes),
        "uploaded_at": datetime.utcnow().isoformat(),
        "file_type": file_type,
        "used_for": used_for,
      "department": department 
    }

    # Update index
    index = load_index(user_uid)
    index.append(entry)
    save_index(user_uid, index)

    return entry

def list_user_files(user_uid: str):
    """Return all metadata entries."""
    return load_index(user_uid)

def get_user_file_path(user_uid: str, file_id: str):
    """
    Return (file_path, metadata_entry)
    Or None if missing.
    """
    index = load_index(user_uid)
    entry = next((f for f in index if f["id"] == file_id), None)

    if not entry:
        return None

    folder = get_user_folder(user_uid)
    file_path = os.path.join(folder, entry["stored_name"])
    print("INDEX ENTRY:", entry)
    print("LOOKING FOR FILE:", file_path)
    print("EXISTS?", os.path.exists(file_path))
    return file_path, entry

def delete_user_file(user_uid: str, file_id: str):
    """Delete user file from disk AND remove metadata."""
    index = load_index(user_uid)
    entry = next((f for f in index if f["id"] == file_id), None)

    if not entry:
        return False

    file_path = os.path.join(get_user_folder(user_uid), entry["stored_name"])

    # Delete from disk
    if os.path.exists(file_path):
        os.remove(file_path)

    # Remove entry from index
    new_index = [f for f in index if f["id"] != file_id]
    save_index(user_uid, new_index)

    return True

def get_direct_file_url(user_uid: str, file_id: str):
    """
    Returns the full OS path for the file, OR None if missing.
    Used when frontend wants to preview a file without a separate API.
    """

    result = get_user_file_path(user_uid, file_id)
    if not result:
        return None
    
    file_path, entry = result
    return {
        "path": file_path,
        "original_name": entry["original_name"],
        "mime": entry["original_name"].split(".")[-1].lower(),
    }