import streamlit as st
import requests

API_BASE = "http://localhost:8000/api"  # Update if your FastAPI host/port is different

st.title("MVP Platform – MVP")

# --- Page Selection ---
page = st.sidebar.radio(
    "Choose Module",
    ("Internal Audit", "External Monitoring")
)

# === INTERNAL AUDIT WORKFLOW ===
if page == "Internal Audit":
    st.header("Internal Audit – Automated Policy Checking")

    upload_source = st.selectbox(
        "Choose upload source",
        ("Local Upload", "Google Drive", "SharePoint")
    )

    selected_file = None
    if upload_source == "Local Upload":
        selected_file = st.file_uploader("Upload your policy file (.pdf, .docx, .txt)")

    elif upload_source == "Google Drive":
        st.info("Click to fetch Google Drive files")
        if st.button("List My Google Drive Files"):
            resp = requests.post(f"{API_BASE}/fetch_files", data={"source": "gdrive"})
            files = resp.json().get("files", [])
            st.write("Your Drive Files:", files)
            # Optionally simulate picking & analyzing
            if files:
                file_to_analyze = st.selectbox("Choose file to analyze", files)
                if st.button("Run Audit on this file"):
                    st.info("Simulated: Would call backend to analyze selected Drive file.")
        st.stop()

    elif upload_source == "SharePoint":
        st.info("Click to fetch SharePoint files")
        if st.button("List My SharePoint Files"):
            resp = requests.post(f"{API_BASE}/fetch_files", data={"source": "sharepoint"})
            files = resp.json().get("files", [])
            st.write("Your SharePoint Files:", files)
            if files:
                file_to_analyze = st.selectbox("Choose file to analyze", files)
                if st.button("Run Audit on this file"):
                    st.info("Simulated: Would call backend to analyze selected SharePoint file.")
        st.stop()

    # Normal file upload analysis
    if selected_file:
        if st.button("Analyze"):
            files = {"file": selected_file}
            resp = requests.post(f"{API_BASE}/internal_compliance_audit", files=files)
            result = resp.json()
            st.success(f"Status: {result['status']}")
            st.json(result)

# === EXTERNAL MONITORING WORKFLOW ===
elif page == "External Monitoring":
    st.header("External Monitoring – Regulatory Intelligence")

    company_options = [
        "Apple Inc.",
        "Microsoft Corporation",
        "Alphabet Inc.",
        "Amazon.com Inc.",
        "Tesla Inc.",
        "DuPont de Nemours Inc.",
        "Dow Inc.",
        "3M Company",
        "BASF SE"
    ]
    company = st.selectbox("Select your company", company_options)
    if st.button("Fetch Industry Intelligence"):
        # For demo, use company name as industry
        resp = requests.get(f"{API_BASE}/external_intelligence", params={"industry": company})
        result = resp.json()
        st.success(f"{company} industry monitoring results:")
        st.json(result)

st.sidebar.markdown("---")
st.sidebar.info(" MVP Demo\n\n- Internal Audit: Upload or fetch files\n- External Monitoring: Select company for analysis\n\nConnects to FastAPI endpoints for all actions.")
