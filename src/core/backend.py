from fastapi import FastAPI, Form
from fastapi.middleware.cors import CORSMiddleware
import os, json, requests, logging, sys
import msal
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

# --------------------------------------------
# Setup
# --------------------------------------------
logging.basicConfig(level=logging.INFO, stream=sys.stdout)

app = FastAPI(title="Unified File Browser API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for testing; restrict later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FILE_PATH = os.path.join(os.getcwd(), "files_metadata.json")


# --------------------------------------------
# Shared JSON helpers
# --------------------------------------------
def load_metadata():
    if os.path.exists(FILE_PATH):
        try:
            with open(FILE_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except:
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


# --------------------------------------------
# Google Drive Config
# --------------------------------------------
G_SCOPES = [
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/drive.metadata.readonly",
]
G_CLIENT_SECRET = "client_secret.json"


# --------------------------------------------
# Microsoft Config
# --------------------------------------------
M_CLIENT_ID = "aa9ebe26-0ef5-4952-9f3d-1dd1a2da33fd"
M_TENANT_ID = "2b2a1005-10ee-406f-a297-d7fb2bf8049d"
M_AUTHORITY = f"https://login.microsoftonline.com/{M_TENANT_ID}"
M_SCOPES = ["User.Read", "Files.Read", "Files.Read.All", "Sites.Read.All"]
msal_app = msal.PublicClientApplication(M_CLIENT_ID, authority=M_AUTHORITY)


def get_ms_token():
    """Authenticate user using device code flow (manual step for now)."""
    flow = msal_app.initiate_device_flow(scopes=M_SCOPES)
    if "user_code" not in flow:
        raise RuntimeError("Failed to create device flow")
    print(f"Go to https://microsoft.com/devicelogin and enter code: {flow['user_code']}")
    result = msal_app.acquire_token_by_device_flow(flow)
    return result


# --------------------------------------------
# Routes
# --------------------------------------------

@app.get("/")
def root():
    return {"message": "Unified File Browser Backend Running ✅"}


@app.post("/api/fetch_files")
async def fetch_files(source: str = Form(...)):
    """Fetch files from GDrive, OneDrive, or SharePoint"""
    source = source.lower()
    metadata_list = []

    # if source == "gdrive":
    #     try:
    #         flow = InstalledAppFlow.from_client_secrets_file(G_CLIENT_SECRET, G_SCOPES)
    #         creds = flow.run_local_server(port=8080)
    #         service = build("drive", "v3", credentials=creds)

    #         results = service.files().list(
    #             q="trashed=false",
    #             fields="files(id,name,mimeType,webViewLink,modifiedTime,size)",
    #             pageSize=10,
    #         ).execute()

    #         files = results.get("files", [])
    #         for f in files:
    #             metadata_list.append({
    #                 "id": f.get("id"),
    #                 "name": f.get("name"),
    #                 "url": f.get("webViewLink"),
    #                 "source": "Google Drive",
    #             })

    #         save_metadata(metadata_list)
    #         return {"files": metadata_list}

    #     except Exception as e:
    #         return {"error": str(e)}

    if source == "gdrive":
        try:
            print("🔐 Starting Google Drive authentication...")
            flow = InstalledAppFlow.from_client_secrets_file(G_CLIENT_SECRET, G_SCOPES)
            creds = flow.run_local_server(port=8080)
            print("✅ Authentication successful!")

            service = build("drive", "v3", credentials=creds)
            print("📂 Fetching latest Google Drive files...")

            # Fetch top 10 non-folder files, ordered by recent modification
            results = service.files().list(
                q="mimeType!='application/vnd.google-apps.folder' and trashed=false",
                orderBy="modifiedTime desc",
                fields="files(id,name,mimeType,webViewLink,modifiedTime,size)",
                pageSize=10,
            ).execute()

            files = results.get("files", [])
            print(f"✅ Retrieved {len(files)} files from Google Drive")

            if not files:
                print("⚠️ No files found in your Google Drive (check if it's empty).")

            for f in files:
                metadata_list.append({
                    "id": f.get("id"),
                    "name": f.get("name"),
                    "mimeType": f.get("mimeType"),
                    "modified": f.get("modifiedTime"),
                    "size": f.get("size"),
                    "url": f.get("webViewLink"),
                    "source": "Google Drive",
                })
                print(f"📄 {f.get('name')} ({f.get('mimeType')})")

            # Save metadata locally
            save_metadata(metadata_list)
            print("💾 Metadata saved to files_metadata.json")

            return {"files": metadata_list}

        except Exception as e:
            print("❌ Error while fetching Google Drive files:", str(e))
            return {"error": str(e)}

    elif source in ["onedrive", "sharepoint"]:
        try:
            token = get_ms_token()
            if not token or "access_token" not in token:
                return {"error": "Microsoft login failed"}

            headers = {"Authorization": f"Bearer {token['access_token']}"}

            if source == "onedrive":
                url = "https://graph.microsoft.com/v1.0/me/drive/root/children"
            else:
                # Example: hardcoded site (you can generalize)
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

        except Exception as e:
            return {"error": str(e)}

    else:
        return {"error": f"Unknown source: {source}"}

def fetch_files_from_source(source: str):
    """Shared function that can be called from main_api.py"""
    source = source.lower()
    metadata_list = []

    if source == "gdrive":
        try:
            flow = InstalledAppFlow.from_client_secrets_file(G_CLIENT_SECRET, G_SCOPES)
            creds = flow.run_local_server(port=8080)
            service = build("drive", "v3", credentials=creds)

            results = service.files().list(
                q="trashed=false",
                fields="files(id,name,mimeType,webViewLink,modifiedTime,size)",
                pageSize=10,
            ).execute()

            files = results.get("files", [])
            for f in files:
                metadata_list.append({
                    "id": f.get("id"),
                    "name": f.get("name"),
                    "url": f.get("webViewLink"),
                    "source": "Google Drive",
                })

            save_metadata(metadata_list)
            return {"files": metadata_list}

        except Exception as e:
            return {"error": str(e)}

    elif source in ["onedrive", "sharepoint"]:
        try:
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

        except Exception as e:
            return {"error": str(e)}

    else:
        return {"error": f"Unknown source: {source}"}
