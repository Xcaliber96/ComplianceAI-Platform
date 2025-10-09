import streamlit as st
import requests
import os
import json
import pandas as pd

API_BASE = "http://localhost:8000/api"  # Update if your FastAPI host/port is different

st.title("MVP Platform – MVP")

page = st.sidebar.radio(
    "Choose Module",
    ("Internal Audit", "External Monitoring")
)

if page == "Internal Audit":
    st.header("Internal Audit – Automated Policy Checking")

    upload_source = st.selectbox(
        "Choose upload source",
        ("Local Upload", "Google Drive", "SharePoint")
    )

    selected_file = None

    if upload_source == "Local Upload":
        selected_file = st.file_uploader("Upload your policy file (.pdf, .docx, .txt)")

        if selected_file and st.button("Run Compliance Audit"):
            # Send file to backend for compliance check
            resp = requests.post(
                f"{API_BASE}/internal_compliance_audit",
                files={"file": (selected_file.name, selected_file, "application/pdf")}
            )
            result = resp.json()

            if result.get("status") == "success":
                st.success("✅ Audit complete!")
                for r in result["results"]:
                    st.write(f"**{r['Reg_ID']}** | {r['Dow_Focus']} | {'✅' if r['Is_Compliant'] else '❌'}")
                    if r["Narrative_Gap"]:
                        st.caption(r["Narrative_Gap"])
            else:
                st.error(result.get("message", "Audit failed"))

    elif upload_source == "Google Drive":
        st.header("📁 Google Drive Browser")

        if "folders" not in st.session_state:
            st.session_state.folders = []
        if "files" not in st.session_state:
            st.session_state.files = []

        # Step 1: Fetch Folders
        if st.button("🔍 Fetch Folders"):
            resp = requests.post(f"{API_BASE}/fetch_files", data={"source": "gdrive", "folder_id": "root"})
            result = resp.json()
            if "error" in result:
                st.error(result["error"])
            else:
                st.session_state.folders = [f for f in result["files"] if f["is_folder"]]
                st.success(f"Found {len(st.session_state.folders)} folders.")

        # Step 2: Folder selection
        if st.session_state.folders:
            folder_names = [f["name"] for f in st.session_state.folders]
            selected_folder_name = st.selectbox("📁 Choose Folder", folder_names)
            selected_folder = next(f for f in st.session_state.folders if f["name"] == selected_folder_name)

            if st.button("📂 List Files in Folder"):
                resp = requests.post(f"{API_BASE}/fetch_files", data={"source": "gdrive", "folder_id": selected_folder["id"]})
                result = resp.json()
                if "error" in result:
                    st.error(result["error"])
                else:
                    # Add audit_status for each file
                    st.session_state.files = [
                        {**f, "audit_status": "Not Audited"}
                        for f in result["files"]
                        if not f["is_folder"]
                    ]
                    st.success(f"Found {len(st.session_state.files)} files.")

        # Step 3: File selection
        if st.session_state.files:
            file_names = [f["name"] for f in st.session_state.files]
            selected_files = st.multiselect("📄 Choose Files to Audit", file_names)

            if selected_files and st.button("✅ Run Compliance Audit"):
                st.info(f"Running compliance audit on {len(selected_files)} file(s)...")
                for file_name in selected_files:
                    st.write(f"Analyzing: {file_name} ...")

                    # Find file ID for the selected file
                    file_meta = next((f for f in st.session_state.files if f["name"] == file_name), None)
                    if not file_meta:
                        st.warning(f"File {file_name} metadata not found.")
                        continue

                    # Request backend to download file
                    resp = requests.post(f"{API_BASE}/download_file", data={"file_id": file_meta["id"]})
                    result = resp.json()

                    if "error" in result:
                        st.error(result["error"])
                        continue

                    file_path = os.path.abspath(result["path"])
                    st.success(f"📥 Downloaded: {file_name}")

                    # Now send file to compliance audit endpoint
                    with open(file_path, "rb") as f:
                        audit_resp = requests.post(
                            f"{API_BASE}/internal_compliance_audit",
                            files={"file": (file_name, f, "application/pdf")}
                        )
                        audit_result = audit_resp.json()

                    if audit_result.get("status") == "success":
                        st.success(f"✅ Audit complete for {file_name}!")
                        file_meta["audit_status"] = "Audited"
                    else:
                        st.error(audit_result.get("message", "Audit failed"))
                        file_meta["audit_status"] = "Failed"

                # Save updated statuses locally
                with open("stored_drive_files.json", "w", encoding="utf-8") as f:
                    json.dump(st.session_state.files, f, indent=4)

    # ================= STORED FILES DASHBOARD =================
    st.markdown("---")
    st.subheader("📋 Stored Google Drive Files")

    stored_path = "stored_drive_files.json"

    if os.path.exists(stored_path):
        with open(stored_path, "r", encoding="utf-8") as f:
            files_data = json.load(f)

        if files_data:
            df = pd.DataFrame(files_data)
            if all(col in df.columns for col in ["name", "url", "audit_status"]):
                st.dataframe(df[["name", "url", "audit_status"]])
            else:
                st.dataframe(df)

            selected_file_name = st.selectbox("Select file to update status", [f["name"] for f in files_data])
            new_status = st.selectbox("New status", ["Not Audited", "In Progress", "Audited"])

            if st.button("💾 Update Status"):
                for f in files_data:
                    if f["name"] == selected_file_name:
                        f["audit_status"] = new_status
                with open(stored_path, "w", encoding="utf-8") as f:
                    json.dump(files_data, f, indent=4)
                st.success(f"Updated status for '{selected_file_name}' → {new_status}")
                st.experimental_rerun()
        else:
            st.info("No stored files yet.")
    else:
        st.info("No stored files found. Fetch folders first to populate.")

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
