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
    subscription_type: Optional[str] = None  # 'free', 'monthly', 'yearly'
    subscription_expires_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None

# Movie Schemas - Content Types: 'movie', 'series', 'free_movie', 'free_series'
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
    price: float = 0
    duration: Optional[int] = None  # in minutes
    genre: Optional[str] = None
    release_year: Optional[int] = None
    language: Optional[str] = None
    is_active: bool = True
    is_free: bool = False  # Free movies can be watched by anyone
    content_type: str = "movie"  # 'movie', 'series', 'free_movie', 'free_series'
    is_featured: bool = False  # Show in featured slider

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
    content_type: Optional[str] = None
    is_featured: Optional[bool] = None

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

# Music Schemas
class MusicBase(BaseModel):
    title: str
    artist: str
    album: Optional[str] = None
    thumbnail_url: Optional[str] = None
    audio_url: Optional[str] = None
    duration: Optional[int] = None  # in seconds
    genre: Optional[str] = None
    release_year: Optional[int] = None
    price: float = 0
    is_free: bool = True
    is_active: bool = True

class MusicCreate(MusicBase):
    pass

class MusicUpdate(BaseModel):
    title: Optional[str] = None
    artist: Optional[str] = None
    album: Optional[str] = None
    thumbnail_url: Optional[str] = None
    audio_url: Optional[str] = None
    duration: Optional[int] = None
    genre: Optional[str] = None
    release_year: Optional[int] = None
    price: Optional[float] = None
    is_free: Optional[bool] = None
    is_active: Optional[bool] = None

class MusicResponse(MusicBase):
    id: str
    created_at: datetime
    views: int = 0
    likes: int = 0
    user_liked: Optional[bool] = None
    
    class Config:
        from_attributes = True

class MusicListResponse(BaseModel):
    tracks: List[MusicResponse]
    total: int

# Series/Seasons Schemas
class SeasonBase(BaseModel):
    series_id: str
    season_number: int
    title: str
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    is_active: bool = True

class SeasonCreate(SeasonBase):
    pass

class SeasonUpdate(BaseModel):
    season_number: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    is_active: Optional[bool] = None

class SeasonResponse(SeasonBase):
    id: str
    created_at: datetime
    episodes_count: int = 0
    
    class Config:
        from_attributes = True

class EpisodeBase(BaseModel):
    season_id: str
    episode_number: int
    title: str
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    video_url: Optional[str] = None
    video_360p: Optional[str] = None
    video_720p: Optional[str] = None
    video_1080p: Optional[str] = None
    duration: Optional[int] = None
    is_active: bool = True

class EpisodeCreate(EpisodeBase):
    pass

class EpisodeUpdate(BaseModel):
    episode_number: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    video_url: Optional[str] = None
    video_360p: Optional[str] = None
    video_720p: Optional[str] = None
    video_1080p: Optional[str] = None
    duration: Optional[int] = None
    is_active: Optional[bool] = None

class EpisodeResponse(EpisodeBase):
    id: str
    created_at: datetime
    views: int = 0
    
    class Config:
        from_attributes = True

# Subscription Plans Schemas
class SubscriptionPlanBase(BaseModel):
    name: str  # 'monthly', 'yearly'
    display_name: str  # 'Monthly Subscription', 'Yearly Subscription'
    price: float
    duration_days: int  # 30 for monthly, 365 for yearly
    description: Optional[str] = None
    is_active: bool = True

class SubscriptionPlanCreate(SubscriptionPlanBase):
    pass

class SubscriptionPlanResponse(SubscriptionPlanBase):
    id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# User Subscription Schemas
class UserSubscriptionResponse(BaseModel):
    id: str
    user_id: str
    plan_id: str
    plan_name: str
    started_at: datetime
    expires_at: datetime
    is_active: bool
    
    class Config:
        from_attributes = True

# Payment Schemas
class PaymentInitiate(BaseModel):
    movie_id: Optional[str] = None
    phone_number: str  # Format: 254XXXXXXXXX
    payment_type: str = "movie"  # 'movie', 'monthly_subscription', 'yearly_subscription'

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
    total_music: int
    total_payments: float
    total_purchases: int
    monthly_subscribers: int
    yearly_subscribers: int

# Like/Dislike Schemas
class MovieReaction(BaseModel):
    movie_id: str
    reaction: str  # "like" or "dislike"

class MusicReaction(BaseModel):
    music_id: str
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

# Trending Response
class TrendingResponse(BaseModel):
    trending_movies: List[MovieResponse]
    trending_series: List[MovieResponse]
    top_liked: List[MovieResponse]
