import streamlit as st
from urllib.parse import unquote

st.set_page_config(page_title="File Mapping", layout="wide")

try:
    params = st.query_params 
except:
    params = st.experimental_get_query_params()

file_param = params.get("file")
if isinstance(file_param, list):
    selected_file = unquote(file_param[0])
elif isinstance(file_param, str):
    selected_file = unquote(file_param)
else:
    selected_file = None

if not selected_file:
    st.warning("No file selected.")
else:
    st.title("🧩 Mapping Page")
    st.subheader(f"Selected File: `{selected_file}`")
