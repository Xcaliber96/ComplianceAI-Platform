from fastapi import APIRouter, Form
import os, json

router = APIRouter(prefix="/api", tags=["auth"])

USER_FILE = "users.json"

def load_users():
    if os.path.exists(USER_FILE):
        with open(USER_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

def save_users(data):
    with open(USER_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)

@router.post("/signup")
def signup(email: str = Form(...), password: str = Form(...)):
    users = load_users()
    if email in users:
        return {"error": "User already exists!"}
    users[email] = {"password": password}
    save_users(users)
    return {"message": f"✅ User {email} created successfully"}

@router.post("/login")
def login(email: str = Form(...), password: str = Form(...)):
    users = load_users()
    if email not in users:
        return {"error": "User not found"}
    if users[email]["password"] != password:
        return {"error": "Invalid password"}
    return {"message": "✅ Login successful", "email": email}