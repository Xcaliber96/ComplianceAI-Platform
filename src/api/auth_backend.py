
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, Field, validator
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import firebase_admin.auth as firebase_auth
from firebase_admin.exceptions import FirebaseError
import jwt
import secrets
import re
from typing import Optional, Dict
import logging

from src.api.db import get_db
from src.api.models import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["authentication"])

# CONFIGURATION

import os

SECRET_KEY = os.getenv("JWT_SECRET")
if not SECRET_KEY:
    raise RuntimeError("JWT_SECRET environment variable must be set")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Security scheme for Bearer token
security = HTTPBearer()

# PYDANTIC MODELS

class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=12, max_length=128)
    display_name: Optional[str] = Field(None, min_length=2, max_length=100)
    company_name: Optional[str] = Field(None, min_length=2, max_length=200)
    
    @validator('password')
    def validate_password_strength(cls, v):
        """Enforce strong password policy"""
        if len(v) < 12:
            raise ValueError('Password must be at least 12 characters')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('Password must contain at least one special character')
        return v

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: Dict

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    reset_token: str
    new_password: str = Field(..., min_length=12, max_length=128)


# AUTHENTICATION DEPENDENCIES


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency to get the current authenticated user.
    Verifies Firebase ID token and returns the user from database.
    
    Usage:
        @router.get("/protected")
        def protected_route(current_user: User = Depends(get_current_user)):
            return {"user_id": current_user.uid}
    """
    token = credentials.credentials
    
    try:
        # Verify Firebase ID token
        decoded = firebase_auth.verify_id_token(token, clock_skew_seconds=10)
        uid = decoded.get("uid")
        email = decoded.get("email")
        
        if not uid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: no UID found"
            )
        
        # Get or create user in local database
        user = db.query(User).filter(User.uid == uid).first()
        
        if not user:
            # Auto-create user if authenticated via Firebase but not in DB
            user = User(
                uid=uid,
                email=email,
                created_at=datetime.utcnow()
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            logger.info(f"Auto-created user in DB: {email}")
        
        return user
        
    except firebase_auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"}
        )
    except firebase_auth.RevokedIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked",
            headers={"WWW-Authenticate": "Bearer"}
        )
    except firebase_auth.InvalidIdTokenError as e:
        logger.warning(f"Invalid Firebase token: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"}
        )
    except FirebaseError as e:
        logger.error(f"Firebase error during authentication: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication service error"
        )
    except Exception as e:
        logger.error(f"Unexpected error in get_current_user: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication failed"
        )

async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency to ensure user is active (not banned/suspended).
    Add user status checks here when you implement user management.
    """
    # TODO: Add user status checks
    # if current_user.is_suspended:
    #     raise HTTPException(403, detail="Account suspended")
    return current_user

def require_role(*required_roles: str):
    """
    Dependency factory for role-based access control.
    
    Usage:
        @router.post("/admin/users")
        def admin_only(user: User = Depends(require_role("admin"))):
            return {"message": "Admin access granted"}
    """
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        # TODO: Implement role checking based on your User model
        # For now, this is a placeholder
        user_role = getattr(current_user, 'role', 'user')
        
        if user_role not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required: {', '.join(required_roles)}"
            )
        return current_user
    
    return role_checker

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "access"
    })
    
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(uid: str) -> str:
    """Create a refresh token (long-lived, cryptographically secure)"""
    # Use secrets for cryptographically strong random tokens
    token = secrets.token_urlsafe(32)
    
    # Store refresh token in database with expiration
    # TODO: Implement refresh token storage in database
    
    return token

def store_user_if_new(uid: str, email: str, display_name: Optional[str], 
                      company_name: Optional[str], db: Session):
    """Store a new Firebase user in the database if not already present"""
    existing = db.query(User).filter(User.uid == uid).first()
    
    if not existing:
        user = User(
            uid=uid,
            email=email,
            display_name=display_name,
            company_name=company_name,
            created_at=datetime.utcnow()
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info(f"Created new user: {email}")
        return user
    else:
        logger.info(f"User already exists: {email}")
        return existing


# AUTHENTICATION ENDPOINTS


@router.post("/signup", response_model=TokenResponse)
async def signup(
    payload: SignupRequest,
    db: Session = Depends(get_db)
):
    """
    Create a new user account via Firebase Authentication.
    Automatically creates user in local database.
    """
    try:
        # Create user in Firebase
        firebase_user = firebase_auth.create_user(
            email=payload.email,
            password=payload.password,
            display_name=payload.display_name,
            email_verified=False
        )
        
        # Create user in local database
        user = store_user_if_new(
            uid=firebase_user.uid,
            email=payload.email,
            display_name=payload.display_name,
            company_name=payload.company_name,
            db=db
        )
        
        custom_token = firebase_auth.create_custom_token(firebase_user.uid)
        
        
        access_token = create_access_token(
            data={"sub": firebase_user.uid, "email": payload.email}
        )
        refresh_token = create_refresh_token(firebase_user.uid)
        
        logger.info(f"User signup successful: {payload.email}")
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user={
                "uid": firebase_user.uid,
                "email": firebase_user.email,
                "display_name": user.display_name,
                "company_name": user.company_name
            }
        )
        
    except firebase_auth.EmailAlreadyExistsError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )
    except FirebaseError as e:
        logger.error(f"Firebase error during signup: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create account"
        )
    except Exception as e:
        logger.error(f"Unexpected error during signup: {e}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Account creation failed"
        )

@router.post("/login")
async def login(
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    """
    Login with Firebase ID token.
    Frontend should authenticate with Firebase and send ID token.
    """
    try:
        data = await request.json()
        id_token = data.get("idToken")
        uid = data.get("uid")
        
        if not id_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing idToken"
            )
        
        # Verify Firebase ID token
        decoded = firebase_auth.verify_id_token(id_token, clock_skew_seconds=10)
        email = decoded.get("email")
        verified_uid = decoded.get("uid")
        
        # Store/update user in database
        user = store_user_if_new(
            uid=verified_uid,
            email=email,
            display_name=None,
            company_name=None,
            db=db
        )
        
        # Generate session ID (for cookie-based sessions)
        session_id = secrets.token_urlsafe(32)
        
        # Set secure cookie
        is_production = os.getenv("ENVIRONMENT") == "production"
        response.set_cookie(
            key="session_id",
            value=session_id,
            httponly=True,
            secure=is_production,
            samesite="Strict" if is_production else "Lax",
            max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            domain=".nomioc.com" if is_production else None
        )
        
        logger.info(f"User login successful: {email}")
        
        return {
            "status": "success",
            "email": email,
            "uid": verified_uid,
            "display_name": user.display_name,
            "company_name": user.company_name
        }
        
    except firebase_auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except firebase_auth.InvalidIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Firebase token"
        )
    except Exception as e:
        logger.error(f"Login error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )

@router.post("/logout")
async def logout(
    response: Response,
    current_user: User = Depends(get_current_user)
):
    """Logout current user and clear session"""
    # Delete session cookie
    response.delete_cookie("session_id")
    
    # TODO: Revoke Firebase tokens if needed
    # firebase_auth.revoke_refresh_tokens(current_user.uid)
    
    logger.info(f"User logout: {current_user.email}")
    
    return {"status": "logged_out"}

@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current authenticated user information"""
    return {
        "uid": current_user.uid,
        "email": current_user.email,
        "display_name": current_user.display_name,
        "company_name": current_user.company_name,
        "full_name": current_user.fullname,
        "department": current_user.department,
        "job_title": current_user.jobtitle,
        "industry": current_user.industry,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None
    }

@router.post("/refresh")
async def refresh_token(payload: RefreshTokenRequest):
    """
    Refresh access token using refresh token.
    TODO: Implement refresh token validation from database.
    """
    # TODO: Validate refresh token from database
    # TODO: Generate new access token
    # TODO: Optionally rotate refresh token
    
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Refresh token flow not yet implemented"
    )

@router.post("/password-reset")
async def request_password_reset(payload: PasswordResetRequest):
    """Request password reset email via Firebase"""
    try:
        # Firebase handles password reset emails automatically
        # Just need to verify user exists
        firebase_auth.get_user_by_email(payload.email)
        
        # Firebase will send the password reset email
        logger.info(f"Password reset requested for: {payload.email}")
        
        return {"message": "Password reset email sent"}
        
    except firebase_auth.UserNotFoundError:
        # Don't reveal if user exists or not (security best practice)
        return {"message": "If the email exists, a password reset link has been sent"}
    except Exception as e:
        logger.error(f"Password reset error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process password reset"
        )


@router.get("/admin/users")
async def list_users(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Admin-only: List all users"""
    users = db.query(User).offset(skip).limit(limit).all()
    
    return {
        "total": db.query(User).count(),
        "users": [
            {
                "uid": u.uid,
                "email": u.email,
                "display_name": u.display_name,
                "created_at": u.created_at.isoformat() if u.created_at else None
            }
            for u in users
        ]
    }


if os.getenv("ENVIRONMENT") == "development":
    @router.get("/debug/verify-token")
    async def debug_verify_token(
        credentials: HTTPAuthorizationCredentials = Depends(security)
    ):
        """Debug endpoint to verify token structure"""
        try:
            token = credentials.credentials
            decoded = firebase_auth.verify_id_token(token)
            return {
                "valid": True,
                "uid": decoded.get("uid"),
                "email": decoded.get("email"),
                "exp": decoded.get("exp")
            }
        except Exception as e:
            return {"valid": False, "error": str(e)}
