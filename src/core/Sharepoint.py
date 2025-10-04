import streamlit as st
import msal
import requests
import uuid

CLIENT_ID = "32e3f59d-93aa-4a64-ad28-ae303b3cf15e"
CLIENT_SECRET = "YOUR-CLIENT-SECRET"
AUTHORITY = "https://login.microsoftonline.com/common"  # multi-tenant
REDIRECT_URI = "http://localhost:8501"   # must match Azure redirect
SCOPE = ["Files.Read", "Sites.Read.All"]

# MSAL app
app = msal.ConfidentialClientApplication(
    CLIENT_ID, authority=AUTHORITY, client_credential=CLIENT_SECRET
)

st.title("📊 Compliance File Mapper (Microsoft Login)")

# Step 1: Generate login link
state = str(uuid.uuid4())
auth_url = app.get_authorization_request_url(
    SCOPE, redirect_uri=REDIRECT_URI, state=state
)

params = st.query_params
if "code" not in params:
    st.write(f"[🔑 Sign in with Microsoft]({auth_url})")
else:
    # Step 2: Capture the code
    code = params["code"][0]

    # Step 3: Exchange for token
    result = app.acquire_token_by_authorization_code(
        code,
        scopes=SCOPE,
        redirect_uri=REDIRECT_URI
    )

    if "access_token" in result:
        access_token = result["access_token"]
        st.success("✅ Logged in!")

        headers = {"Authorization": f"Bearer {access_token}"}
        resp = requests.get("https://graph.microsoft.com/v1.0/me/drive/root/children", headers=headers)

        if resp.status_code == 200:
            files = resp.json().get("value", [])
            st.write("### Files in your OneDrive:")
            for f in files:
                st.write(f"- [{f['name']}]({f['webUrl']})")
        else:
            st.error(f"Graph API error: {resp.json()}")
    else:
        st.error("Failed to acquire token")
