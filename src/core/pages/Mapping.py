import streamlit as st
from urllib.parse import unquote

st.set_page_config(page_title="File Mapping", layout="wide")

# --- Detect the file name from query params ---
try:
    params = st.query_params  # Streamlit ≥1.32
except:
    params = st.experimental_get_query_params()

# Handle both string and list cases safely
file_param = params.get("file")
if isinstance(file_param, list):
    selected_file = unquote(file_param[0])
elif isinstance(file_param, str):
    selected_file = unquote(file_param)
else:
    selected_file = None

# --- Display ---
if not selected_file:
    st.warning("No file selected.")
else:
    st.title("🧩 Mapping Page")
    st.subheader(f"Selected File: `{selected_file}`")
