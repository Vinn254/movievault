from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: Optional[str] = None
    profile_photo: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: str
    is_admin: bool = False
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None

# Movie Schemas
class MovieBase(BaseModel):
    title: str
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    video_url: Optional[str] = None
    video_360p: Optional[str] = None
    video_720p: Optional[str] = None
    video_1080p: Optional[str] = None
    trailer_url: Optional[str] = None
    subtitle_url: Optional[str] = None
    subtitle_language: Optional[str] = None
    price: float
    duration: Optional[int] = None  # in minutes
    genre: Optional[str] = None
    release_year: Optional[int] = None
    language: Optional[str] = None
    is_active: bool = True
    is_free: bool = False  # Free movies can be watched by anyone

class MovieCreate(MovieBase):
    pass

class MovieUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    video_url: Optional[str] = None
    video_360p: Optional[str] = None
    video_720p: Optional[str] = None
    video_1080p: Optional[str] = None
    trailer_url: Optional[str] = None
    subtitle_url: Optional[str] = None
    subtitle_language: Optional[str] = None
    price: Optional[float] = None
    duration: Optional[int] = None
    genre: Optional[str] = None
    release_year: Optional[int] = None
    language: Optional[str] = None
    is_active: Optional[bool] = None
    is_free: Optional[bool] = None

class MovieResponse(MovieBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    views: int = 0
    likes: int = 0
    dislikes: int = 0
    user_liked: Optional[bool] = None
    user_disliked: Optional[bool] = None
    user_subscribed: Optional[bool] = None
    
    class Config:
        from_attributes = True

class MovieListResponse(BaseModel):
    movies: List[MovieResponse]
    total: int

# Payment Schemas
class PaymentInitiate(BaseModel):
    movie_id: str
    phone_number: str  # Format: 254XXXXXXXXX

class PaymentResponse(BaseModel):
    checkout_request_id: str
    customer_message: str

class PaymentCallback(BaseModel):
    Body: dict

class PaymentStatus(BaseModel):
    checkout_request_id: str
    amount: float
    status: str
    mpesa_receipt_number: Optional[str] = None
    phone_number: Optional[str] = None
    created_at: datetime

# Purchase Schemas
class PurchaseResponse(BaseModel):
    id: str
    user_id: str
    movie_id: str
    payment_id: str
    created_at: datetime
    expires_at: datetime
    
    class Config:
        from_attributes = True

class StreamResponse(BaseModel):
    movie_id: str
    video_url: str
    token: str
    expires_at: datetime

# Admin Stats
class AdminStats(BaseModel):
    total_users: int
    total_movies: int
    total_payments: float
    total_purchases: int

# Like/Dislike Schemas
class MovieReaction(BaseModel):
    movie_id: str
    reaction: str  # "like" or "dislike"

class SubscriptionSchema(BaseModel):
    movie_id: str

class SubscriptionResponse(BaseModel):
    id: str
    user_id: str
    movie_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True
