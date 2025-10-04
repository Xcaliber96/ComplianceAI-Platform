import streamlit as st
from pyvis.network import Network
import networkx as nx

# -------------------
# Hardcoded File Data
# -------------------
# Simulated files from Google Drive & SharePoint
hardcoded_files = {
    "Google Drive": [
        {"name": "HR Report.xlsx", "url": "https://drive.google.com/file/d/12345/view", "owner": "Charlie", "size": "500KB"},
        {"name": "Security Checklist.pdf", "url": "https://drive.google.com/file/d/67890/view", "owner": "Dana", "size": "300KB"},
    ],
    "SharePoint": [
        {"name": "Audit Logging Policy.pdf", "url": "https://example.sharepoint.com/docs/audit_logging.pdf", "owner": "Alice", "size": "200KB"},
        {"name": "Access Control Policy.docx", "url": "https://example.sharepoint.com/docs/access_control.docx", "owner": "Bob", "size": "150KB"},
    ]
}

# -------------------
# Streamlit App
# -------------------
st.set_page_config(page_title="Compliance File Mapper", layout="wide")
st.title("📊 Compliance File Mapper")

platform = st.selectbox("Choose a platform:", ["SharePoint", "Google Drive"])

# Use hardcoded files instead of fetching from API
files = hardcoded_files.get(platform, [])

# -------------------
# Display Results
# -------------------
if files:
    st.subheader("📂 File List")
    for f in files:
        st.write(f"- [{f['name']}]({f['url']}) ({f.get('size', 'N/A')})")

    # -------------------
    # Graph Visualization
    # -------------------
    st.subheader("🌐 File Source Graph")

    G = nx.Graph()
    source_node = platform

    # Add source node
    G.add_node(source_node, color="lightblue", size=40)

    # Add file nodes (clickable + hover metadata)
    for f in files:
        title = f"Name: {f['name']}<br>Owner: {f.get('owner', 'N/A')}<br>Size: {f.get('size', 'N/A')}"
        G.add_node(
            f['name'],
            title=title,
            color="lightgreen",
            size=20,
            href=f['url']
        )
        G.add_edge(source_node, f['name'])

    # Build PyVis graph
    net = Network(height="500px", width="100%", notebook=False, directed=False)
    net.from_nx(G)

    # Make sure clicking opens link in new tab
    for node in net.nodes:
        if "href" in node:
            node["target"] = "_blank"

    net.save_graph("network.html")
    st.components.v1.html(open("network.html", "r").read(), height=550)

else:
    st.info("No files to display yet.")
