from fastapi import FastAPI, Form
from fastapi.middleware.cors import CORSMiddleware
import os, json, requests, logging, sys, traceback
import msal
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request

# ============================================================
# Setup
# ============================================================
logging.basicConfig(level=logging.INFO, stream=sys.stdout)

app = FastAPI(title="Unified File Browser API", version="1.2")
STORED_FILES = "stored_drive_files.json"
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# File paths
# ============================================================
FILE_PATH = os.path.join(os.getcwd(), "files_metadata.json")
TOKEN_FILE = os.path.join(os.getcwd(), "token.json")

# ============================================================
# JSON helpers
# ============================================================
def load_metadata():
    if os.path.exists(FILE_PATH):
        try:
            with open(FILE_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []
    return []


def save_metadata(new_entries):
    existing = load_metadata()
    existing_ids = {x.get("id") for x in existing}
    new = [x for x in new_entries if x.get("id") not in existing_ids]
    combined = existing + new
    with open(FILE_PATH, "w", encoding="utf-8") as f:
        json.dump(combined, f, indent=4)
    return len(new), len(combined)

G_SCOPES = [
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/drive.metadata.readonly",
]
G_CLIENT_SECRET = "client_secret.json"

M_CLIENT_ID = "aa9ebe26-0ef5-4952-9f3d-1dd1a2da33fd"
M_TENANT_ID = "2b2a1005-10ee-406f-a297-d7fb2bf8049d"
M_AUTHORITY = f"https://login.microsoftonline.com/{M_TENANT_ID}"
M_SCOPES = ["User.Read", "Files.Read", "Files.Read.All", "Sites.Read.All"]
msal_app = msal.PublicClientApplication(M_CLIENT_ID, authority=M_AUTHORITY)


def get_ms_token():
    """Authenticate Microsoft user using device code flow."""
    flow = msal_app.initiate_device_flow(scopes=M_SCOPES)
    if "user_code" not in flow:
        raise RuntimeError("Failed to create device flow")
    print(f"Go to https://microsoft.com/devicelogin and enter code: {flow['user_code']}")
    result = msal_app.acquire_token_by_device_flow(flow)
    return result


def load_stored_files():
    """Load stored file metadata if it exists."""
    if os.path.exists(STORED_FILES):
        with open(STORED_FILES, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

def save_stored_files(data):
    """Save updated file metadata."""
    with open(STORED_FILES, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)

def fetch_files_from_source(source: str, folder_id: str = "root"):
    """
    Shared helper used by FastAPI and main_api.py
    Fetches files from Google Drive, OneDrive, or SharePoint.
    """
    source = source.lower()
    metadata_list = []

    try:
        if source == "gdrive":
            print("🔐 Checking existing Google credentials...")
            creds = None
            if os.path.exists(TOKEN_FILE):
                creds = Credentials.from_authorized_user_file(TOKEN_FILE, G_SCOPES)

            if not creds or not creds.valid:
                if creds and creds.expired and creds.refresh_token:
                    print("♻️ Refreshing expired Google token...")
                    creds.refresh(Request())
                else:
                    print("🔑 Starting new Google OAuth login...")
                    flow = InstalledAppFlow.from_client_secrets_file(G_CLIENT_SECRET, G_SCOPES)
                    creds = flow.run_local_server(port=8080)
                with open(TOKEN_FILE, "w", encoding="utf-8") as token:
                    token.write(creds.to_json())

            service = build("drive", "v3", credentials=creds)
            print(f"📂 Listing files in folder: {folder_id}")

            results = service.files().list(
                q=f"'{folder_id}' in parents and trashed=false",
                fields="files(id,name,mimeType,webViewLink,modifiedTime,size)",
                pageSize=50,
            ).execute()

            files = results.get("files", [])
            for f in files:
                metadata_list.append({
                    "id": f.get("id"),
                    "name": f.get("name"),
                    "mimeType": f.get("mimeType"),
                    "modified": f.get("modifiedTime"),
                    "size": f.get("size", "0"),
                    "url": f.get("webViewLink"),
                    "is_folder": f.get("mimeType") == "application/vnd.google-apps.folder",
                })
            save_metadata(metadata_list)
            
            # Save all file metadata locally
            stored = load_stored_files()
            existing_ids = {f["id"] for f in stored}
            new_files = [f for f in metadata_list if f["id"] not in existing_ids]
            for f in new_files:
                f["audit_status"] = "Not Audited"
                stored.append(f)
            save_stored_files(stored)
            return {"files": metadata_list}
        elif source in ["onedrive", "sharepoint"]:
            token = get_ms_token()
            if not token or "access_token" not in token:
                return {"error": "Microsoft login failed"}

            headers = {"Authorization": f"Bearer {token['access_token']}"}

            if source == "onedrive":
                url = "https://graph.microsoft.com/v1.0/me/drive/root/children"
            else:
                site_url = "https://graph.microsoft.com/v1.0/sites/vidauria.sharepoint.com:/sites/CompAI"
                site_resp = requests.get(site_url, headers=headers)
                site_id = site_resp.json().get("id")
                url = f"https://graph.microsoft.com/v1.0/sites/{site_id}/drives"

            resp = requests.get(url, headers=headers)
            if resp.status_code != 200:
                return {"error": resp.text}

            data = resp.json().get("value", [])
            for f in data:
                metadata_list.append({
                    "id": f.get("id"),
                    "name": f.get("name"),
                    "url": f.get("webUrl", ""),
                    "source": source.capitalize(),
                })
            save_metadata(metadata_list)
            return {"files": metadata_list}

        else:
            return {"error": f"Unknown source: {source}"}

    except Exception as e:
        print("❌ Error while fetching:", e)
        traceback.print_exc()
        return {"error": str(e)}

@app.get("/")
def root():
    return {"message": "Unified File Browser Backend Running ✅"}


@app.post("/api/fetch_files")
async def fetch_files(source: str = Form(...), folder_id: str = Form(default="root")):
    """API route — delegates to shared helper"""
    return fetch_files_from_source(source, folder_id)


@app.post("/api/logout")
async def logout():
    """Clears cached Google token"""
    if os.path.exists(TOKEN_FILE):
        os.remove(TOKEN_FILE)
        return {"message": "🔓 Logged out successfully"}
    return {"message": "No credentials found to clear"}
