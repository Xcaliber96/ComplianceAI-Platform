import streamlit as st
from streamlit_cognito_auth import CognitoAuthenticator

# =========================================================
# AWS Cognito Configuration
# =========================================================
USER_POOL_ID = "us-east-1_1t2hrL4TI"
CLIENT_ID = "2kq6mfpdj7fosgc715sc9212vr"
CLIENT_SECRET = "YOUR_CLIENT_SECRET"  # replace with actual secret
COGNITO_DOMAIN = "yourapp.auth.us-east-1.amazoncognito.com"  # change this to your Cognito domain
REDIRECT_URI = "http://localhost:8501"  # this must match your Cognito app client's redirect URI

# =========================================================
# Initialize Cognito Authenticator
# =========================================================
authenticator = CognitoAuthenticator(
    user_pool_id=USER_POOL_ID,
    client_id=CLIENT_ID,
    client_secret=CLIENT_SECRET,
    domain=COGNITO_DOMAIN,
    redirect_uri=REDIRECT_URI,
)

# =========================================================
# Streamlit App Logic
# =========================================================
st.set_page_config(page_title="AWS Cognito Login", page_icon="🔐")
st.title("🔐 Secure Login with AWS Cognito")

# Perform login
user = authenticator.login("Sign in with AWS Cognito")

# =========================================================
# If user logged in successfully
# =========================================================
if user:
    st.success(f"✅ Welcome, {user['email']}!")
    st.json(user)  # shows tokens and user info (ID, email, etc.)

    # Example: protected area
    st.subheader("🔒 Protected Content")
    st.write("You can now fetch and analyze compliance files securely.")

else:
    st.warning("Please sign in to continue.")
