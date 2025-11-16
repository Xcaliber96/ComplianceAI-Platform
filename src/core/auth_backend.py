from fastapi import APIRouter, Form, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
import os
import json
import jwt
from datetime import datetime, timedelta

router = APIRouter(prefix="/api", tags=["auth"])

# ------------------------------
# CONFIG
# ------------------------------
USER_FILE = "users.json"
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-this")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")

# ------------------------------
# UTIL FUNCTIONS
# ------------------------------
def load_users():
    if os.path.exists(USER_FILE):
        with open(USER_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

def save_users(data):
    with open(USER_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# ------------------------------
# AUTH ENDPOINTS
# ------------------------------
@router.post("/signup")
def signup(
    email: str = Form(...),
    password: str = Form(...)
):
    users = load_users()
    
    if email in users:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User already exists"
        )

    hashed_pw = pwd_context.hash(password)
    users[email] = {
        "password": hashed_pw,
        "role": "user"   # default role
    }
    save_users(users)

    return {"message": f"User {email} created successfully"}


@router.post("/login")
def login(
    email: str = Form(...),
    password: str = Form(...)
):
    users = load_users()

    if email not in users:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    hashed_pw = users[email]["password"]

    if not pwd_context.verify(password, hashed_pw):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid password"
        )

    token = create_access_token({"sub": email, "role": users[email]["role"]})

    return {
        "message": "Login successful",
        "access_token": token,
        "token_type": "bearer",
        "email": email
    }

# ------------------------------
# OPTIONAL PROTECTED ROUTE EXAMPLE
# ------------------------------
def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return {"email": payload.get("sub"), "role": payload.get("role")}
    except:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

@router.get("/me")
def read_current_user(user=Depends(get_current_user)):
    return user
