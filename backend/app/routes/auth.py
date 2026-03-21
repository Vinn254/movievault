from fastapi import APIRouter, Depends, HTTPException, status, Body, Body
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import datetime
from typing import Optional
import uuid
import os
import httpx

from app.database import Database, USERS_COLLECTION
from app.schemas import UserCreate, UserLogin, UserResponse, Token
from app.auth import verify_password, get_password_hash, create_access_token, decode_token

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

ADMIN_SECRET = os.getenv("ADMIN_SECRET", "admin-secret-key")

# Firebase configuration
FIREBASE_API_KEY = os.getenv("FIREBASE_API_KEY", "AIzaSyC7XLTe91IOldSkonVUAPcICTDIGApJ0f0")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    """Get current authenticated user"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_token(token)
    if payload is None:
        raise credentials_exception
    
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    db = Database.get_db()
    user = await db[USERS_COLLECTION].find_one({"_id": user_id})
    
    if user is None:
        raise credentials_exception
    
    # Add is_admin from token to ensure it's available
    user['is_admin'] = user.get('is_admin', payload.get('is_admin', False))
    return user

async def get_current_admin(current_user: dict = Depends(get_current_user)):
    """Get current admin user"""
    if not current_user.get("is_admin", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user: UserCreate, admin_secret: str = None):
    """Register a new user"""
    db = Database.get_db()
    
    # Check if email already exists
    existing_user = await db[USERS_COLLECTION].find_one({"email": user.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if username already exists
    existing_username = await db[USERS_COLLECTION].find_one({"username": user.username})
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Create user document
    user_id = str(uuid.uuid4())
    now = datetime.utcnow()
    
    # Check if admin secret is provided and valid
    is_admin = False
    if admin_secret == ADMIN_SECRET:
        is_admin = True
    
    user_doc = {
        "_id": user_id,
        "email": user.email,
        "username": user.username,
        "full_name": user.full_name,
        "profile_photo": user.profile_photo,
        "password_hash": get_password_hash(user.password),
        "is_admin": is_admin,
        "created_at": now,
        "updated_at": now
    }
    
    await db[USERS_COLLECTION].insert_one(user_doc)
    
    # Return user response (exclude password)
    return {
        "id": user_id,
        "email": user.email,
        "username": user.username,
        "full_name": user.full_name,
        "profile_photo": user.profile_photo,
        "is_admin": is_admin,
        "created_at": now,
        "updated_at": now
    }

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Login user and get access token"""
    db = Database.get_db()
    
    # Find user by email (OAuth2 form uses username field for email)
    user = await db[USERS_COLLECTION].find_one({"email": form_data.username})
    
    if not user or not verify_password(form_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token - include is_admin so it's immediately available
    access_token = create_access_token(
        data={"sub": user["_id"], "email": user["email"], "is_admin": user.get("is_admin", False)}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user profile"""
    return {
        "id": current_user["_id"],
        "email": current_user["email"],
        "username": current_user["username"],
        "full_name": current_user.get("full_name"),
        "is_admin": current_user.get("is_admin", False),
        "created_at": current_user["created_at"],
        "updated_at": current_user.get("updated_at")
    }

@router.post("/promote")
async def promote_user(email: str, secret: str):
    """Promote a user to admin using secret key"""
    if secret != ADMIN_SECRET:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid secret key"
        )
    
    db = Database.get_db()
    
    result = await db[USERS_COLLECTION].update_one(
        {"email": email},
        {"$set": {"is_admin": True}}
    )
    
    if result.modified_count == 0:
        # Check if user exists
        user = await db[USERS_COLLECTION].find_one({"email": email})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
    
    return {"message": f"User {email} promoted to admin"}

@router.post("/google", response_model=Token)
async def google_login(google_data: dict = Body(...)):
    """Google OAuth login - verify token and create/get user"""
    id_token = google_data.get("id_token")
    if not id_token:
        raise HTTPException(status_code=400, detail="id_token is required")
    try:
        # Verify the Google ID token
        async with httpx.AsyncClient() as client:
            google_verify_url = f"https://identitytoolkit.googleapis.com/v1/accounts:lookup?key={FIREBASE_API_KEY}"
            response = await client.post(google_verify_url, json={"idToken": id_token})
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid Google ID token"
                )
            
            user_data = response.json()
            if not user_data.get("users"):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid Google ID token"
                )
            
            google_user = user_data["users"][0]
            email = google_user.get("email")
            display_name = google_user.get("displayName", "")
            photo_url = google_user.get("photoUrl", "")
        
        db = Database.get_db()
        
        # Check if user exists
        user = await db[USERS_COLLECTION].find_one({"email": email})
        
        if not user:
            # Create new user
            user_id = str(uuid.uuid4())
            now = datetime.utcnow()
            
            # Generate username from email
            username = email.split("@")[0]
            
            # Check if username exists, if so, add random suffix
            existing_username = await db[USERS_COLLECTION].find_one({"username": username})
            if existing_username:
                username = f"{username}{str(uuid.uuid4())[:8]}"
            
            user_doc = {
                "_id": user_id,
                "email": email,
                "username": username,
                "full_name": display_name,
                "profile_photo": photo_url,
                "password_hash": get_password_hash(str(uuid.uuid4())),  # Random password for OAuth users
                "is_admin": False,
                "created_at": now,
                "updated_at": now
            }
            
            await db[USERS_COLLECTION].insert_one(user_doc)
            user = user_doc
        
        # Create access token
        access_token = create_access_token(
            data={"sub": user["_id"], "email": user["email"]}
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer"
        }
    except httpx.HTTPError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Failed to verify Google token"
        )
