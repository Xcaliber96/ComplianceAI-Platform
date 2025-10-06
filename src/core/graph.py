import streamlit as st
import json
import os
import random
from streamlit_cytoscapejs import st_cytoscapejs

# ============================================
# Load File Metadata
# ============================================
def load_file_metadata(json_path="files_metadata.json"):
    if not os.path.exists(json_path):
        st.warning("⚠️ No metadata file found.")
        return []
    try:
        with open(json_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        st.error(f"❌ JSON load failed: {e}")
        return []

files = load_file_metadata()
if not files:
    st.stop()

# ============================================
# Build Cytoscape Elements
# ============================================
elements = []

# Source nodes
sources = sorted(set(f.get("source", "Unknown") for f in files))
for src in sources:
    elements.append({
        "data": {"id": src, "label": src},
        "classes": "source"
    })

# File nodes + edges
for f in files:
    file_id = f["name"]
    elements.append({
        "data": {
            "id": file_id,
            "label": f["name"],
            "url": f.get("url", "#"),
            "owner": f.get("owner", "N/A"),
            "size": f.get("size", "N/A"),
            "source": f.get("source", "Unknown")
        },
        "classes": "file"
    })
    elements.append({
        "data": {"source": f.get("source", "Unknown"), "target": file_id},
        "classes": "link"
    })

# ============================================
# Cytoscape Styling
# ============================================
stylesheet = [
    {"selector": "node", "style": {"label": "data(label)", "font-size": "14px", "color": "#FFF"}},
    {"selector": ".source", "style": {"background-color": "#00E5FF", "width": 45, "height": 45}},
    {"selector": ".file", "style": {"background-color": "#6C63FF", "width": 25, "height": 25}},
    {"selector": ".link", "style": {"width": 2, "line-color": "#999"}},
    {"selector": ":selected", "style": {"background-color": "#FFD700", "line-color": "#FFD700"}}
]

# ============================================
# Streamlit Layout
# ============================================
st.set_page_config(page_title="Compliance Graph", layout="wide")
st.markdown("## 🌌 Compliance Graph – Neo4j Bloom Style")

col1, col2 = st.columns([3, 2])

# Graph panel
with col1:
    result = st_cytoscapejs(elements, stylesheet, key="graph_main")
    st.markdown("### 🔍 Raw output from st_cytoscapejs:")
    st.json(result)

# Info panel
with col2:
    st.markdown("### 📄 Node Info Panel")

    if result and "selected_node_id" in result and result["selected_node_id"]:
        selected_id = result["selected_node_id"]

        # ✅ Show file info if exists
        selected_meta = next((f for f in files if f["name"] == selected_id), None)

        if selected_meta:
            st.success(f"**Selected File:** {selected_meta['name']}")
            st.markdown(f"**Source:** {selected_meta.get('source', 'N/A')}")
            st.markdown(f"**Owner:** {selected_meta.get('owner', 'N/A')}")
            st.markdown(f"**Size:** {selected_meta.get('size', 'N/A')}")
            mapping_link = f"/Mapping?file={selected_meta['name']}"
            st.markdown(f"[🧭 Open in Mapping Page]({mapping_link})")
        else:
            st.info(f"This is a platform/source node: **{selected_id}**")
    else:
        st.info("Click a file node to view its details.")
