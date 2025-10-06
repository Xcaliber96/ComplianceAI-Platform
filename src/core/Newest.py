import streamlit as st
import requests, os, json, logging, sys, webbrowser
import msal
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

logging.basicConfig(level=logging.INFO, stream=sys.stdout)

# --------------------------------------------
# Shared Config
# --------------------------------------------
FILE_PATH = os.path.join(os.getcwd(), "files_metadata.json")

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
    "https://www.googleapis.com/auth/drive.metadata.readonly"
]
G_CLIENT_SECRET = "client_secret.json"

# --------------------------------------------
# Microsoft Config (OneDrive + SharePoint)
# --------------------------------------------
M_CLIENT_ID = "aa9ebe26-0ef5-4952-9f3d-1dd1a2da33fd"
M_TENANT_ID = "2b2a1005-10ee-406f-a297-d7fb2bf8049d"
M_AUTHORITY = f"https://login.microsoftonline.com/{M_TENANT_ID}"
M_SCOPES = ["User.Read", "Files.Read", "Files.Read.All", "Sites.Read.All"]

msal_app = msal.PublicClientApplication(M_CLIENT_ID, authority=M_AUTHORITY)

def get_ms_token():
    """Authenticate user using Device Flow."""
    result = None
    accounts = msal_app.get_accounts()
    if accounts:
        result = msal_app.acquire_token_silent(M_SCOPES, account=accounts[0])

    if not result:
        flow = msal_app.initiate_device_flow(scopes=M_SCOPES)
        if "user_code" not in flow:
            st.error("❌ Failed to create device flow")
            return None

        st.write("### 🪪 Login Required")
        st.write("Go to [https://microsoft.com/devicelogin](https://microsoft.com/devicelogin)")
        st.code(flow["user_code"], language="text")

        result = msal_app.acquire_token_by_device_flow(flow)
    return result

# --------------------------------------------
# Streamlit UI
# --------------------------------------------
st.set_page_config(page_title="📂 Unified File Browser", layout="centered")
st.title("📂 Unified File Browser — Google Drive, OneDrive & SharePoint")

platform = st.selectbox("🌍 Choose a platform:", ["Google Drive", "OneDrive", "SharePoint"])

# =====================================================
# GOOGLE DRIVE SECTION
# =====================================================
if platform == "Google Drive":
    if "g_creds" not in st.session_state:
        if st.button("🔑 Sign in to Google Drive"):
            try:
                flow = InstalledAppFlow.from_client_secrets_file(G_CLIENT_SECRET, G_SCOPES)
                creds = flow.run_local_server(port=8080)
                st.session_state.g_creds = creds
                st.success("✅ Google authentication successful!")
                st.rerun()
            except Exception as e:
                st.error(f"❌ Google Auth Failed: {e}")
    else:
        creds = st.session_state.g_creds
        service = build("drive", "v3", credentials=creds)

        def get_folders():
            res = service.files().list(
                q="mimeType='application/vnd.google-apps.folder' and trashed=false",
                fields="files(id,name)"
            ).execute()
            return res.get("files", [])

        def get_files(folder_id):
            res = service.files().list(
                q=f"'{folder_id}' in parents and trashed=false",
                fields="files(id,name,mimeType,size,modifiedTime,webViewLink)"
            ).execute()
            return res.get("files", [])

        folders = get_folders()
        folder_names = [f["name"] for f in folders]
        folder_map = {f["name"]: f["id"] for f in folders}

        folder_choice = st.selectbox("📁 Choose a Folder", ["-- Select --"] + folder_names)

        if folder_choice != "-- Select --":
            folder_id = folder_map[folder_choice]
            files = get_files(folder_id)
            file_names = [f["name"] for f in files]
            file_map = {f["name"]: f for f in files}

            file_choice = st.selectbox("📄 Choose a File", ["-- Select File --"] + file_names)
            if file_choice != "-- Select File --":
                file = file_map[file_choice]
                st.json(file)
                st.markdown(f"[🔗 Open in Drive]({file['webViewLink']})")
                st.download_button(
                    "📋 Download Metadata (JSON)",
                    data=json.dumps(file, indent=4),
                    file_name=f"{file['name']}_metadata.json"
                )

                save_metadata([{
                    "id": file["id"],
                    "name": file["name"],
                    "source": "Google Drive",
                    "url": file["webViewLink"],
                }])

# =====================================================
# MICROSOFT SECTION (OneDrive + SharePoint)
# =====================================================
else:
    if st.button("🔑 Sign in with Microsoft"):
        token = get_ms_token()

        if not token or "access_token" not in token:
            st.error("❌ Login failed")
            st.stop()

        st.success("✅ Microsoft authentication successful!")
        headers = {"Authorization": f"Bearer {token['access_token']}"}

        # Display user info
        resp = requests.get("https://graph.microsoft.com/v1.0/me", headers=headers)
        st.write("### 👤 User Profile")
        st.json(resp.json())

        metadata_list = []

        # ---------------- OneDrive ----------------
        if platform == "OneDrive":
            st.write("### ☁️ OneDrive Files")
            files_resp = requests.get("https://graph.microsoft.com/v1.0/me/drive/root/children", headers=headers)
            if files_resp.status_code == 200:
                files = files_resp.json().get("value", [])
                if files:
                    for item in files:
                        metadata = {
                            "name": item.get("name"),
                            "id": item.get("id"),
                            "size": item.get("size"),
                            "type": item.get("file", {}).get("mimeType", "folder"),
                            "lastModified": item.get("lastModifiedDateTime"),
                            "webUrl": item.get("webUrl"),
                            "source": "OneDrive",
                        }
                        metadata_list.append(metadata)
                        st.markdown(f"📄 **[{item['name']}]({item['webUrl']})**")
                else:
                    st.info("No files found in OneDrive.")
            else:
                st.error(f"Graph API error {files_resp.status_code}")
                st.json(files_resp.json())

        # ---------------- SharePoint ----------------
        elif platform == "SharePoint":
            st.write("### 🏢 SharePoint Site – CompAI")
            site_url = "https://graph.microsoft.com/v1.0/sites/vidauria.sharepoint.com:/sites/CompAI"
            resp = requests.get(site_url, headers=headers)
            site_data = resp.json()

            if resp.status_code == 200:
                st.success("✅ Found SharePoint site!")
                site_id = site_data["id"]
                drives_resp = requests.get(f"https://graph.microsoft.com/v1.0/sites/{site_id}/drives", headers=headers)
                drives_data = drives_resp.json()

                if "value" in drives_data and len(drives_data["value"]) > 0:
                    drive_id = drives_data["value"][0]["id"]
                    files_resp = requests.get(f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root/children", headers=headers)
                    if files_resp.status_code == 200:
                        files = files_resp.json().get("value", [])
                        if files:
                            st.write("### 📄 Files in ‘Documents’ Library")
                            for f in files:
                                metadata = {
                                    "name": f.get("name"),
                                    "id": f.get("id"),
                                    "size": f.get("size"),
                                    "type": f.get("file", {}).get("mimeType", "folder"),
                                    "lastModified": f.get("lastModifiedDateTime"),
                                    "webUrl": f.get("webUrl"),
                                    "source": "SharePoint",
                                }
                                metadata_list.append(metadata)
                                st.markdown(f"📄 **[{f['name']}]({f['webUrl']})**")
                        else:
                            st.info("No files found in this library.")
                    else:
                        st.error(f"Graph API error {files_resp.status_code}")
                        st.json(files_resp.json())
            else:
                st.error("❌ Could not access SharePoint site.")
                st.json(site_data)

        # Save metadata
        if metadata_list:
            added, total = save_metadata(metadata_list)
            st.success(f"✅ {added} new entries added. Total records in JSON: {total}")
            with open(FILE_PATH, "r", encoding="utf-8") as f:
                st.download_button(
                    label="📦 Download Combined JSON",
                    data=f.read(),
                    file_name="files_metadata.json",
                    mime="application/json",
                )
