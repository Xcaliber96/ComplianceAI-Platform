import streamlit as st
import requests
import os
import json
import base64
import pandas as pd

API_BASE = "http://localhost:8000/api"

# ==========================================================
# PAGE SELECTION
# ==========================================================
st.title("🧠 Compliance AI Dashboard")

page = st.sidebar.radio(
    "Choose Module",
    ("Internal Audit", "External Monitoring")
)

if page == "Internal Audit":

    def show_pdf(file_path):
        """Preview PDF inline."""
        with open(file_path, "rb") as f:
            base64_pdf = base64.b64encode(f.read()).decode("utf-8")
        pdf_display = f'<iframe src="data:application/pdf;base64,{base64_pdf}" width="100%" height="700"></iframe>'
        st.markdown(pdf_display, unsafe_allow_html=True)

    def show_file_preview(file_path, file_name):
        """Render file preview dynamically."""
        st.markdown(f"### 📄 {file_name}")
        if file_name.endswith(".txt"):
            with open(file_path, "r", encoding="utf-8") as f:
                st.text_area("📝 File Content", f.read(), height=600)
        elif file_name.endswith(".json"):
            with open(file_path, "r", encoding="utf-8") as f:
                st.json(json.load(f))
        elif file_name.endswith(".pdf"):
            show_pdf(file_path)
        else:
            st.info("Unsupported preview format.")

    def run_audit(file_path, file_name, department, country, state):
        """Run backend compliance audit and show results."""
        with open(file_path, "rb") as f:
            audit_resp = requests.post(
                f"{API_BASE}/internal_compliance_audit",
                files={"file": (file_name, f, "application/pdf")},
                data={"department": department, "country": country, "state": state}
            )

        if audit_resp.status_code != 200:
            st.error(f"Server error: {audit_resp.status_code}")
            st.text(audit_resp.text)
            return None

        try:
            return audit_resp.json()
        except Exception:
            st.error("❌ Invalid JSON from backend.")
            st.text(audit_resp.text)
            return None

    def show_audit_results(audit_result):
        """Display audit output neatly with feedback."""
        if audit_result.get("status") != "success":
            st.error(audit_result.get("message", "Audit failed"))
            return

        st.success("✅ Compliance Audit Complete")
        st.write(f"**Total Requirements Checked:** {audit_result['total_requirements']}")
        st.markdown("---")

        for r in audit_result["results"]:
            st.markdown(f"### 🧾 `{r['Reg_ID']}` — {r['Dow_Focus']}")
            col1, col2 = st.columns(2)
            with col1:
                st.markdown(f"**Risk Rating:** {r['Risk_Rating']}")
                st.markdown(f"**Target Area:** {r['Target_Area']}")
            with col2:
                st.markdown(f"**Compliance Score:** `{r['Compliance_Score']:.2f}%`")
                st.markdown(f"**Compliant:** {'✅ Yes' if r['Is_Compliant'] else '❌ No'}")

            if r["Narrative_Gap"]:
                st.markdown("#### 🧩 Narrative Gap")
                st.info(r["Narrative_Gap"])

            with st.expander("📜 View Evidence Chunk"):
                st.write(r["Evidence_Chunk"])

            # Feedback section
            feedback = st.radio(
                f"Was this assessment accurate for {r['Reg_ID']}?",
                ["✅ Agree", "❌ Disagree", "📝 Needs Review"],
                key=f"feedback_{r['Reg_ID']}"
            )
            if st.button(f"Submit Feedback for {r['Reg_ID']}", key=f"submit_{r['Reg_ID']}"):
                st.success(f"Feedback recorded: {feedback}")
            st.markdown("---")

    tab1, tab2, tab3 = st.tabs(["📂 Upload & Fetch", "⚙️ Run Audit", "📊 Audit Results"])

    with tab1:
        st.subheader("Upload or Fetch Documents")

        upload_source = st.selectbox(
            "Choose source",
            ("Local Upload", "Google Drive", "SharePoint")
        )

        if upload_source == "Local Upload":
            selected_file = st.file_uploader("Upload a policy file (.pdf, .docx, .txt)")
            if selected_file:
                os.makedirs("tmp", exist_ok=True)
                path = os.path.join("tmp", selected_file.name)
                with open(path, "wb") as f:
                    f.write(selected_file.read())
                st.session_state["selected_file"] = {"path": path, "name": selected_file.name}
                st.success(f"✅ File '{selected_file.name}' uploaded successfully! Go to **Run Audit** tab.")

        elif upload_source == "Google Drive":
            st.subheader("📁 Google Drive Browser")

            if st.button("🔍 Fetch Folders"):
                resp = requests.post(f"{API_BASE}/fetch_files", data={"source": "gdrive", "folder_id": "root"})
                result = resp.json()

                if "error" in result:
                    st.error(result["error"])
                else:
                    st.session_state.folders = [f for f in result["files"] if f["is_folder"]]
                    st.success(f"Found {len(st.session_state.folders)} folders.")

            # Step 2: Folder selection
            if st.session_state.get("folders"):
                folder_names = [f["name"] for f in st.session_state.folders]
                selected_folder_name = st.selectbox("📂 Choose Folder", folder_names)
                selected_folder = next(f for f in st.session_state.folders if f["name"] == selected_folder_name)

                if st.button("📂 List Files"):
                    resp = requests.post(
                        f"{API_BASE}/fetch_files",
                        data={"source": "gdrive", "folder_id": selected_folder["id"]}
                    )
                    result = resp.json()
                    if "error" in result:
                        st.error(result["error"])
                    else:
                        st.session_state.files = [f for f in result["files"] if not f["is_folder"]]
                        st.success(f"Found {len(st.session_state.files)} files in {selected_folder_name}.")

            # Step 3: Show files
            if st.session_state.get("files"):
                st.markdown("### 📄 Files in Folder:")
                file_names = [f["name"] for f in st.session_state.files]
                selected_file_name = st.selectbox("Select a file to audit:", file_names)

                if selected_file_name:
                    st.session_state["selected_file"] = {
                        "name": selected_file_name,
                        "source": "gdrive",
                        "meta": next(f for f in st.session_state.files if f["name"] == selected_file_name)
                    }
                    st.success(f"✅ '{selected_file_name}' selected! Go to **Run Audit** tab.")

        elif upload_source == "SharePoint":
            st.info("💼 SharePoint integration coming soon.")

    with tab2:
        st.subheader("Run Compliance Audit")

        if "selected_file" not in st.session_state:
            st.warning("Please upload or select a file in the first tab.")
        else:
            file_info = st.session_state["selected_file"]
            st.markdown(f"### ✅ You picked: `{file_info['name']}`")
            st.info("Would you like to run an audit on this file?")

            # Optional preview if local
            if "path" in file_info:
                show_file_preview(file_info["path"], file_info["name"])

            # Filters
            st.markdown("### 🔍 Apply Filters")
            col1, col2, col3 = st.columns(3)
            with col1:
                department = st.selectbox("Department", ["All", "HR", "Finance", "IT", "Legal"])
            with col2:
                country = st.selectbox("Country", ["All", "USA", "UK", "Egypt", "India"])
            with col3:
                state = st.text_input("State / Region (optional)")

            if st.button("🚀 Run Audit Now"):
                if file_info.get("source") == "gdrive":
                    # Download file first
                    resp = requests.post(f"{API_BASE}/download_file", data={"file_id": file_info["meta"]["id"]})
                    result = resp.json()
                    if "error" in result:
                        st.error(result["error"])
                    else:
                        file_path = result["path"]
                        st.success(f"📥 Downloaded {file_info['name']} successfully!")
                        show_file_preview(file_path, file_info["name"])
                        audit_result = run_audit(file_path, file_info["name"], department, country, state)
                        st.session_state["last_audit"] = audit_result
                        st.success("✅ Audit completed!")
                else:
                    audit_result = run_audit(file_info["path"], file_info["name"], department, country, state)
                    st.session_state["last_audit"] = audit_result
                    st.success("✅ Audit completed!")


    with tab3:
        st.subheader("📊 Audit Results and Insights")

        if "last_audit" not in st.session_state or not st.session_state["last_audit"]:
            st.info("No audit results yet. Please run a compliance audit in the previous tab.")
        else:
            audit_result = st.session_state["last_audit"]

            st.success("✅ Compliance Audit Complete")
            st.write(f"**Total Requirements Checked:** {audit_result['total_requirements']}")
            st.markdown("---")

            for r in audit_result["results"]:
                st.markdown(f"### 🧾 `{r['Reg_ID']}` — {r['Dow_Focus']}")
                col1, col2 = st.columns(2)
                with col1:
                    st.markdown(f"**Risk Rating:** {r['Risk_Rating']}")
                    st.markdown(f"**Target Area:** {r['Target_Area']}")
                with col2:
                    st.markdown(f"**Compliance Score:** `{r['Compliance_Score']:.2f}%`")
                    st.markdown(f"**Compliant:** {'✅ Yes' if r['Is_Compliant'] else '❌ No'}")

                if r["Narrative_Gap"]:
                    st.markdown("#### 🧩 Narrative Gap")
                    st.info(r["Narrative_Gap"])

                with st.expander("📜 View Evidence Chunk"):
                    st.write(r["Evidence_Chunk"])

                st.markdown("---")
            try:
                df = pd.DataFrame([
                    {
                        "Reg_ID": r["Reg_ID"],
                        "Score": r["Compliance_Score"],
                        "Compliant": "Yes" if r["Is_Compliant"] else "No",
                        "Risk": r["Risk_Rating"]
                    }
                    for r in audit_result["results"]
                ])
                st.subheader("📈 Compliance Overview")
                st.bar_chart(df.set_index("Reg_ID")["Score"])
            except Exception as e:
                st.warning(f"Could not render chart: {e}")

            st.markdown("### 💬 Feedback")
            feedback = st.text_area("Share your feedback about these results:")
            if st.button("Submit Feedback"):
                st.success("✅ Feedback submitted. Thank you!")


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
