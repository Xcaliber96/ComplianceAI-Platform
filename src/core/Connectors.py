import streamlit as st
import msal
import requests
from google.oauth2 import service_account
from googleapiclient.discovery import build

# ====== GOOGLE DRIVE ======
def fetch_gdrive_files(folder_id, creds):
    service = build("drive", "v3", credentials=creds)
    results = service.files().list(
        q=f"'{folder_id}' in parents and trashed=false",
        fields="files(id, name)"
    ).execute()
    return results.get("files", [])


# ====== SHAREPOINT ======
CLIENT_ID = "YOUR-CLIENT-ID"
TENANT_ID = "YOUR-TENANT-ID"
CLIENT_SECRET = "YOUR-CLIENT-SECRET"

AUTHORITY = f"https://login.microsoftonline.com/{TENANT_ID}"
SCOPE = ["https://graph.microsoft.com/.default"]

def get_access_token():
    """Authenticate with Azure AD and return a Microsoft Graph token"""
    app = msal.ConfidentialClientApplication(
        CLIENT_ID, authority=AUTHORITY, client_credential=CLIENT_SECRET
    )
    result = app.acquire_token_for_client(scopes=SCOPE)
    if "access_token" in result:
        return result["access_token"]
    else:
        raise Exception("Failed to acquire token", result)


def fetch_sharepoint_files(site_url):
    """
    Fetch files from the root document library of a SharePoint site
    using Microsoft Graph API
    """
    token = get_access_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Get site ID
    domain = site_url.split("/")[2]  # e.g., contoso.sharepoint.com
    path = "/" + "/".join(site_url.split("/")[3:])  # e.g., /sites/Compliance
    site_resp = requests.get(
        f"https://graph.microsoft.com/v1.0/sites/{domain}:{path}",
        headers=headers
    )
    site_id = site_resp.json()["id"]

    # Get default document library (drive)
    drive_resp = requests.get(
        f"https://graph.microsoft.com/v1.0/sites/{site_id}/drives",
        headers=headers
    )
    drive_id = drive_resp.json()["value"][0]["id"]

    # Get files in root folder
    files_resp = requests.get(
        f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root/children",
        headers=headers
    )
    files = files_resp.json().get("value", [])
    return [{"name": f["name"], "url": f["webUrl"]} for f in files]


# ====== GOOGLE DRIVE CREDS ======
SERVICE_ACCOUNT_FILE = "compliance-473813-77510ba23840.json"
SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]

creds = service_account.Credentials.from_service_account_file(
    SERVICE_ACCOUNT_FILE, scopes=SCOPES
)

# ====== STREAMLIT UI ======
st.title("📊 Compliance File Mapper")

platform = st.selectbox("Choose a platform:", ["SharePoint", "Google Drive"])

if platform == "SharePoint":
    site_url = st.text_input("Enter SharePoint Site URL:", help="Example: https://contoso.sharepoint.com/sites/Compliance")

    if st.button("Fetch SharePoint Files"):
        if site_url:
            try:
                files = fetch_sharepoint_files(site_url)
                if files:
                    st.write("### Files Found:")
                    for f in files:
                        st.write(f"- [{f['name']}]({f['url']})")
                else:
                    st.info("No files found in this site.")
            except Exception as e:
                st.error(f"Error: {e}")
        else:
            st.warning("Please enter the SharePoint Site URL.")

elif platform == "Google Drive":
    folder_id = st.text_input("Enter Google Drive Folder ID:")

    if st.button("Fetch Google Drive Files"):
        if folder_id:
            files = fetch_gdrive_files(folder_id, creds)
            if files:
                st.write("### Files Found:")
                for f in files:
                    st.write(f"- {f['name']} (ID: {f['id']})")
            else:
                st.info("No files found. Make sure the folder is shared with your service account email.")
        else:
            st.warning("Please enter a Folder ID.")
