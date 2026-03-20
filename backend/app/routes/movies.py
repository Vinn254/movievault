from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime, timedelta
import uuid

from app.database import Database, MOVIES_COLLECTION, MUSIC_COLLECTION, PURCHASES_COLLECTION, REACTIONS_COLLECTION, SUBSCRIPTIONS_COLLECTION, SUBSCRIPTION_PLANS_COLLECTION, USER_SUBSCRIPTIONS_COLLECTION, SERIES_COLLECTION, SEASONS_COLLECTION, EPISODES_COLLECTION
from app.schemas import (
    MovieCreate, MovieUpdate, MovieResponse, MovieListResponse,
    StreamResponse, PurchaseResponse, MovieReaction, SubscriptionResponse,
    MusicCreate, MusicUpdate, MusicResponse, MusicListResponse, MusicReaction,
    SeasonCreate, SeasonUpdate, SeasonResponse, EpisodeCreate, EpisodeUpdate, EpisodeResponse,
    SubscriptionPlanCreate, SubscriptionPlanResponse, UserSubscriptionResponse, TrendingResponse
)
from app.routes.auth import get_current_user, get_current_admin
from app.firebase import firebase_service
from app.auth import create_access_token

router = APIRouter(prefix="/api", tags=["Content"])

# Subscription plan prices
MONTHLY_PRICE = 500  # KSH
YEARLY_PRICE = 5000  # KSH
FREE_TRIAL_HOURS = 24  # 24 hour free trial for free movies

# Debug endpoint to fix is_free
@router.get("/movies/debug-fix/{movie_id}")
async def fix_movie_free_get(movie_id: str, is_free: bool = True):
    """Fix movie is_free flag - debug endpoint"""
    db = Database.get_db()
    
    result = await db[MOVIES_COLLECTION].update_one(
        {"_id": movie_id},
        {"$set": {"is_free": is_free, "updated_at": datetime.utcnow()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    return {"message": f"Movie {movie_id} updated with is_free={is_free}"}

# ==================== TRENDING ENDPOINTS ====================
@router.get("/trending")
async def get_trending():
    """Get trending movies, series, and music based on views and likes"""
    db = Database.get_db()
    
    # Get trending movies (top 10 by views)
    trending_movies_cursor = db[MOVIES_COLLECTION].find(
        {"is_active": True, "content_type": {"$in": ["movie", "free_movie"]}}
    ).sort("views", -1).limit(10)
    trending_movies = await trending_movies_cursor.to_list(length=10)
    
    # Get trending series (top 10 by views)
    trending_series_cursor = db[MOVIES_COLLECTION].find(
        {"is_active": True, "content_type": {"$in": ["series", "free_series"]}}
    ).sort("views", -1).limit(10)
    trending_series = await trending_series_cursor.to_list(length=10)
    
    # Get trending music (top 10 by likes)
    trending_music_cursor = db[MUSIC_COLLECTION].find(
        {"is_active": True}
    ).sort("likes", -1).limit(10)
    trending_music = await trending_music_cursor.to_list(length=10)
    
    # Get top liked (top 10 by likes - movies, series, and music combined)
    top_liked_movies = await db[MOVIES_COLLECTION].find(
        {"is_active": True}
    ).sort("likes", -1).limit(10).to_list(length=10)
    
    top_liked_music = await db[MUSIC_COLLECTION].find(
        {"is_active": True}
    ).sort("likes", -1).limit(10).to_list(length=10)
    
    # Combine and sort by likes
    all_top_liked = []
    for m in top_liked_movies:
        m["content_type"] = m.get("content_type", "movie")
        all_top_liked.append(m)
    for m in top_liked_music:
        m["content_type"] = "music"
        all_top_liked.append(m)
    all_top_liked.sort(key=lambda x: x.get("likes", 0), reverse=True)
    top_liked = all_top_liked[:10]
    
    return {
        "trending_movies": [
            {
                "id": m["_id"],
                "title": m["title"],
                "description": m.get("description"),
                "thumbnail_url": m.get("thumbnail_url"),
                "video_url": m.get("video_url"),
                "price": m["price"],
                "duration": m.get("duration"),
                "genre": m.get("genre"),
                "release_year": m.get("release_year"),
                "language": m.get("language"),
                "is_active": m.get("is_active", True),
                "is_free": m.get("is_free", False),
                "content_type": m.get("content_type", "movie"),
                "is_featured": m.get("is_featured", False),
                "created_at": m["created_at"],
                "updated_at": m.get("updated_at"),
                "views": m.get("views", 0),
                "likes": m.get("likes", 0),
                "dislikes": m.get("dislikes", 0)
            }
            for m in trending_movies
        ],
        "trending_series": [
            {
                "id": m["_id"],
                "title": m["title"],
                "description": m.get("description"),
                "thumbnail_url": m.get("thumbnail_url"),
                "video_url": m.get("video_url"),
                "price": m["price"],
                "duration": m.get("duration"),
                "genre": m.get("genre"),
                "release_year": m.get("release_year"),
                "language": m.get("language"),
                "is_active": m.get("is_active", True),
                "is_free": m.get("is_free", False),
                "content_type": m.get("content_type", "series"),
                "is_featured": m.get("is_featured", False),
                "created_at": m["created_at"],
                "updated_at": m.get("updated_at"),
                "views": m.get("views", 0),
                "likes": m.get("likes", 0),
                "dislikes": m.get("dislikes", 0)
            }
            for m in trending_series
        ],
        "trending_music": [
            {
                "id": m["_id"],
                "title": m["title"],
                "artist": m.get("artist"),
                "album": m.get("album"),
                "thumbnail_url": m.get("thumbnail_url"),
                "audio_url": m.get("audio_url"),
                "duration": m.get("duration"),
                "genre": m.get("genre"),
                "release_year": m.get("release_year"),
                "price": m["price"],
                "is_free": m.get("is_free", True),
                "is_active": m.get("is_active", True),
                "created_at": m["created_at"],
                "views": m.get("views", 0),
                "likes": m.get("likes", 0)
            }
            for m in trending_music
        ],
        "top_liked": [
            {
                "id": m["_id"],
                "title": m["title"],
                "description": m.get("description"),
                "thumbnail_url": m.get("thumbnail_url"),
                "video_url": m.get("video_url"),
                "price": m["price"],
                "duration": m.get("duration"),
                "genre": m.get("genre"),
                "release_year": m.get("release_year"),
                "language": m.get("language"),
                "is_active": m.get("is_active", True),
                "is_free": m.get("is_free", False),
                "content_type": m.get("content_type", "movie"),
                "is_featured": m.get("is_featured", False),
                "created_at": m["created_at"],
                "updated_at": m.get("updated_at"),
                "views": m.get("views", 0),
                "likes": m.get("likes", 0),
                "dislikes": m.get("dislikes", 0)
            }
            for m in top_liked
        ]
    }

# ==================== FEATURED ENDPOINTS ====================
@router.get("/featured")
async def get_featured():
    """Get featured movies (is_featured=true) or top liked"""
    db = Database.get_db()
    
    # First try to get explicitly featured movies
    featured_cursor = db[MOVIES_COLLECTION].find(
        {"is_active": True, "is_featured": True}
    ).sort("likes", -1).limit(10)
    featured = await featured_cursor.to_list(length=10)
    
    # If no featured movies, get top liked
    if not featured:
        featured_cursor = db[MOVIES_COLLECTION].find(
            {"is_active": True}
        ).sort([("likes", -1), ("views", -1)]).limit(10)
        featured = await featured_cursor.to_list(length=10)
    
    return {
        "featured": [
            {
                "id": m["_id"],
                "title": m["title"],
                "description": m.get("description"),
                "thumbnail_url": m.get("thumbnail_url"),
                "video_url": m.get("video_url"),
                "trailer_url": m.get("trailer_url"),
                "price": m["price"],
                "duration": m.get("duration"),
                "genre": m.get("genre"),
                "release_year": m.get("release_year"),
                "language": m.get("language"),
                "is_active": m.get("is_active", True),
                "is_free": m.get("is_free", False),
                "content_type": m.get("content_type", "movie"),
                "is_featured": m.get("is_featured", False),
                "created_at": m["created_at"],
                "updated_at": m.get("updated_at"),
                "views": m.get("views", 0),
                "likes": m.get("likes", 0),
                "dislikes": m.get("dislikes", 0)
            }
            for m in featured
        ]
    }

# ==================== SUBSCRIPTION PLANS ENDPOINTS ====================
@router.get("/subscription/plans")
async def get_subscription_plans():
    """Get available subscription plans"""
    plans = [
        {
            "_id": "monthly",
            "name": "monthly",
            "display_name": "Monthly Subscription",
            "price": MONTHLY_PRICE,
            "duration_days": 30,
            "description": "Access all premium movies and series for 1 month",
            "is_active": True
        },
        {
            "_id": "yearly",
            "name": "yearly",
            "display_name": "Yearly Subscription",
            "price": YEARLY_PRICE,
            "duration_days": 365,
            "description": "Access all premium movies and series for 1 year - Save 17%",
            "is_active": True
        }
    ]
    
    return {"plans": plans}

@router.get("/subscription/my-status")
async def get_my_subscription_status(current_user: dict = Depends(get_current_user)):
    """Get current user's subscription status"""
    db = Database.get_db()
    user_id = current_user["_id"]
    
    # Check for active subscription
    subscription = await db[USER_SUBSCRIPTIONS_COLLECTION].find_one({
        "user_id": user_id,
        "expires_at": {"$gt": datetime.utcnow()}
    })
    
    if subscription:
        return {
            "has_subscription": True,
            "subscription_type": subscription["plan_name"],
            "expires_at": subscription["expires_at"]
        }
    
    return {
        "has_subscription": False,
        "subscription_type": None,
        "expires_at": None
    }

# ==================== MUSIC ENDPOINTS ====================
@router.get("/music", response_model=MusicListResponse)
async def get_music(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    genre: Optional[str] = None,
    search: Optional[str] = None
):
    """Get all music tracks with optional filtering"""
    db = Database.get_db()
    
    query = {"is_active": True}
    
    if genre:
        query["genre"] = genre
    
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"artist": {"$regex": search, "$options": "i"}}
        ]
    
    total = await db[MUSIC_COLLECTION].count_documents(query)
    
    tracks_cursor = db[MUSIC_COLLECTION].find(query).skip(skip).limit(limit).sort("created_at", -1)
    tracks = await tracks_cursor.to_list(length=limit)
    
    return {
        "tracks": [
            {
                "id": t["_id"],
                "title": t["title"],
                "artist": t["artist"],
                "album": t.get("album"),
                "thumbnail_url": t.get("thumbnail_url"),
                "audio_url": t.get("audio_url"),
                "duration": t.get("duration"),
                "genre": t.get("genre"),
                "release_year": t.get("release_year"),
                "price": t.get("price", 0),
                "is_free": t.get("is_free", True),
                "is_active": t.get("is_active", True),
                "created_at": t["created_at"],
                "views": t.get("views", 0),
                "likes": t.get("likes", 0)
            }
            for t in tracks
        ],
        "total": total
    }

@router.get("/music/{music_id}")
async def get_music_track(music_id: str):
    """Get a single music track by ID"""
    db = Database.get_db()
    
    track = await db[MUSIC_COLLECTION].find_one({"_id": music_id, "is_active": True})
    
    if not track:
        raise HTTPException(status_code=404, detail="Music track not found")
    
    # Increment view count
    await db[MUSIC_COLLECTION].update_one({"_id": music_id}, {"$inc": {"views": 1}})
    
    return {
        "id": track["_id"],
        "title": track["title"],
        "artist": track["artist"],
        "album": track.get("album"),
        "thumbnail_url": track.get("thumbnail_url"),
        "audio_url": track.get("audio_url"),
        "duration": track.get("duration"),
        "genre": track.get("genre"),
        "release_year": track.get("release_year"),
        "price": track.get("price", 0),
        "is_free": track.get("is_free", True),
        "is_active": track.get("is_active", True),
        "created_at": track["created_at"],
        "views": track.get("views", 0) + 1,
        "likes": track.get("likes", 0)
    }

@router.post("/music", status_code=status.HTTP_201_CREATED)
async def create_music(track: MusicCreate, current_user: dict = Depends(get_current_admin)):
    """Create a new music track (Admin only)"""
    db = Database.get_db()
    
    track_id = str(uuid.uuid4())
    now = datetime.utcnow()
    
    track_doc = {
        "_id": track_id,
        "title": track.title,
        "artist": track.artist,
        "album": track.album,
        "thumbnail_url": track.thumbnail_url,
        "audio_url": track.audio_url,
        "duration": track.duration,
        "genre": track.genre,
        "release_year": track.release_year,
        "price": track.price,
        "is_free": track.is_free,
        "is_active": track.is_active,
        "created_at": now,
        "views": 0,
        "likes": 0
    }
    
    await db[MUSIC_COLLECTION].insert_one(track_doc)
    
    return {
        "id": track_id,
        "title": track.title,
        "artist": track.artist,
        "created_at": now
    }

@router.post("/music/like")
async def like_music(reaction: MusicReaction, current_user: dict = Depends(get_current_user)):
    """Like or dislike a music track"""
    db = Database.get_db()
    user_id = current_user["_id"]
    
    # Check if track exists
    track = await db[MUSIC_COLLECTION].find_one({"_id": reaction.music_id})
    if not track:
        raise HTTPException(status_code=404, detail="Music track not found")
    
    # Check if user already has a reaction
    existing_reaction = await db[REACTIONS_COLLECTION].find_one({
        "music_id": reaction.music_id,
        "user_id": user_id
    })
    
    if existing_reaction:
        old_reaction = existing_reaction.get("reaction")
        await db[REACTIONS_COLLECTION].update_one(
            {"_id": existing_reaction["_id"]},
            {"$set": {"reaction": reaction.reaction}}
        )
        
        if old_reaction != reaction.reaction:
            if old_reaction == "like":
                await db[MUSIC_COLLECTION].update_one(
                    {"_id": reaction.music_id},
                    {"$inc": {"likes": -1}}
                )
            if reaction.reaction == "like":
                await db[MUSIC_COLLECTION].update_one(
                    {"_id": reaction.music_id},
                    {"$inc": {"likes": 1}}
                )
    else:
        reaction_id = str(uuid.uuid4())
        await db[REACTIONS_COLLECTION].insert_one({
            "_id": reaction_id,
            "music_id": reaction.music_id,
            "user_id": user_id,
            "reaction": reaction.reaction,
            "created_at": datetime.utcnow()
        })
        
        if reaction.reaction == "like":
            await db[MUSIC_COLLECTION].update_one(
                {"_id": reaction.music_id},
                {"$inc": {"likes": 1}}
            )
    
    return {"message": "Reaction updated successfully"}

@router.put("/music/{music_id}")
async def update_music(music_id: str, track_update: MusicUpdate, current_user: dict = Depends(get_current_admin)):
    """Update a music track (Admin only)"""
    db = Database.get_db()
    
    # Check if track exists
    existing = await db[MUSIC_COLLECTION].find_one({"_id": music_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Track not found")
    
    update_data = track_update.dict(exclude_unset=True)
    
    if update_data:
        await db[MUSIC_COLLECTION].update_one(
            {"_id": music_id},
            {"$set": update_data}
        )
    
    updated_track = await db[MUSIC_COLLECTION].find_one({"_id": music_id})
    updated_track["_id"] = str(updated_track["_id"])
    return updated_track

@router.delete("/music/{music_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_music(music_id: str, current_user: dict = Depends(get_current_admin)):
    """Delete a music track (Admin only)"""
    db = Database.get_db()
    
    # Check if track exists
    existing = await db[MUSIC_COLLECTION].find_one({"_id": music_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Track not found")
    
    # Soft delete
    await db[MUSIC_COLLECTION].update_one(
        {"_id": music_id},
        {"$set": {"is_active": False}}
    )

# ==================== SERIES/SEASONS ENDPOINTS ====================
@router.get("/series/{series_id}/seasons")
async def get_series_seasons(series_id: str):
    """Get all seasons for a series"""
    db = Database.get_db()
    
    # Check if series exists
    series = await db[MOVIES_COLLECTION].find_one({"_id": series_id, "is_active": True})
    if not series:
        raise HTTPException(status_code=404, detail="Series not found")
    
    # Get seasons
    seasons_cursor = db[SEASONS_COLLECTION].find(
        {"series_id": series_id, "is_active": True}
    ).sort("season_number", 1)
    seasons = await seasons_cursor.to_list(length=100)
    
    # Get episode count for each season
    result = []
    for season in seasons:
        episode_count = await db[EPISODES_COLLECTION].count_documents({
            "season_id": season["_id"],
            "is_active": True
        })
        result.append({
            "id": season["_id"],
            "series_id": season["series_id"],
            "season_number": season["season_number"],
            "title": season["title"],
            "description": season.get("description"),
            "thumbnail_url": season.get("thumbnail_url"),
            "is_active": season.get("is_active", True),
            "created_at": season["created_at"],
            "episodes_count": episode_count
        })
    
    return {"seasons": result}

@router.get("/seasons/{season_id}/episodes")
async def get_season_episodes(season_id: str):
    """Get all episodes for a season"""
    db = Database.get_db()
    
    # Check if season exists
    season = await db[SEASONS_COLLECTION].find_one({"_id": season_id, "is_active": True})
    if not season:
        raise HTTPException(status_code=404, detail="Season not found")
    
    # Get episodes
    episodes_cursor = db[EPISODES_COLLECTION].find(
        {"season_id": season_id, "is_active": True}
    ).sort("episode_number", 1)
    episodes = await episodes_cursor.to_list(length=100)
    
    return {
        "episodes": [
            {
                "id": e["_id"],
                "season_id": e["season_id"],
                "episode_number": e["episode_number"],
                "title": e["title"],
                "description": e.get("description"),
                "thumbnail_url": e.get("thumbnail_url"),
                "video_url": e.get("video_url"),
                "video_360p": e.get("video_360p"),
                "video_720p": e.get("video_720p"),
                "video_1080p": e.get("video_1080p"),
                "duration": e.get("duration"),
                "is_active": e.get("is_active", True),
                "created_at": e["created_at"],
                "views": e.get("views", 0)
            }
            for e in episodes
        ]
    }

@router.get("/episodes/{episode_id}/stream")
async def stream_episode(episode_id: str, current_user: dict = Depends(get_current_user)):
    """Get streaming URL for an episode"""
    db = Database.get_db()
    
    # Get episode
    episode = await db[EPISODES_COLLECTION].find_one({"_id": episode_id, "is_active": True})
    if not episode:
        raise HTTPException(status_code=404, detail="Episode not found")
    
    # Get season and series info
    season = await db[SEASONS_COLLECTION].find_one({"_id": episode["season_id"]})
    if not season:
        raise HTTPException(status_code=404, detail="Season not found")
    
    series = await db[MOVIES_COLLECTION].find_one({"_id": season["series_id"], "is_active": True})
    if not series:
        raise HTTPException(status_code=404, detail="Series not found")
    
    # Check if user has access (subscription or free content)
    is_admin = current_user.get("is_admin", False)
    is_free = series.get("is_free", False)
    
    # Check subscription
    subscription = await db[USER_SUBSCRIPTIONS_COLLECTION].find_one({
        "user_id": current_user["_id"],
        "expires_at": {"$gt": datetime.utcnow()}
    })
    
    if not is_admin and not is_free and not subscription:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please subscribe to watch this series"
        )
    
    # Generate streaming token
    stream_token = create_access_token(
        data={
            "sub": current_user["_id"],
            "episode_id": episode_id,
            "type": "episode"
        },
        expires_delta=datetime.timedelta(hours=STREAM_TOKEN_EXPIRE_HOURS)
    )
    
    # Get video URL
    video_url = episode.get("video_url", "")
    if video_url and not is_admin:
        video_url = firebase_service.get_video_url(video_url.split("/")[-1])
    
    # Increment view count
    await db[EPISODES_COLLECTION].update_one({"_id": episode_id}, {"$inc": {"views": 1}})
    await db[MOVIES_COLLECTION].update_one({"_id": series["_id"]}, {"$inc": {"views": 1}})
    
    return {
        "episode_id": episode_id,
        "series_id": series["_id"],
        "season_id": season["_id"],
        "video_url": video_url,
        "token": stream_token
    }

# ==================== MOVIES ENDPOINTS ====================

# Streaming token expiry (24 hours)
STREAM_TOKEN_EXPIRE_HOURS = 24
STREAM_ACCESS_EXPIRE_HOURS = 48  # How long user can watch after payment

@router.get("/movies", response_model=MovieListResponse)
async def get_movies(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    genre: Optional[str] = None,
    search: Optional[str] = None,
    content_type: Optional[str] = None  # 'movie', 'series', 'free_movie', 'free_series'
):
    """Get all movies with optional filtering"""
    db = Database.get_db()
    
    # Build query
    query = {"is_active": True}
    
    if genre:
        query["genre"] = genre
    
    if content_type:
        query["content_type"] = content_type
    
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    # Get total count
    total = await db[MOVIES_COLLECTION].count_documents(query)
    
    # Get movies
    movies_cursor = db[MOVIES_COLLECTION].find(query).skip(skip).limit(limit).sort("created_at", -1)
    movies = await movies_cursor.to_list(length=limit)
    
    # Convert to response format
    movie_list = []
    for movie in movies:
        movie_list.append({
            "id": movie["_id"],
            "title": movie["title"],
            "description": movie.get("description"),
            "thumbnail_url": movie.get("thumbnail_url"),
            "video_url": movie.get("video_url"),
            "price": movie["price"],
            "is_free": movie.get("is_free", False),
            "content_type": movie.get("content_type", "movie"),
            "is_featured": movie.get("is_featured", False),
            "duration": movie.get("duration"),
            "genre": movie.get("genre"),
            "release_year": movie.get("release_year"),
            "language": movie.get("language"),
            "is_active": movie.get("is_active", True),
            "created_at": movie["created_at"],
            "updated_at": movie.get("updated_at"),
            "views": movie.get("views", 0),
            "likes": movie.get("likes", 0),
            "dislikes": movie.get("dislikes", 0)
        })
    
    return {"movies": movie_list, "total": total}

@router.get("/{movie_id}", response_model=MovieResponse)
async def get_movie(movie_id: str):
    """Get a single movie by ID"""
    db = Database.get_db()
    
    movie = await db[MOVIES_COLLECTION].find_one({"_id": movie_id, "is_active": True})
    
    if not movie:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Movie not found"
        )
    
    # Increment view count
    await db[MOVIES_COLLECTION].update_one(
        {"_id": movie_id},
        {"$inc": {"views": 1}}
    )
    
    return {
        "id": movie["_id"],
        "title": movie["title"],
        "description": movie.get("description"),
        "thumbnail_url": movie.get("thumbnail_url"),
        "video_url": movie.get("video_url"),
        "price": movie["price"],
        "is_free": movie.get("is_free", False),
        "duration": movie.get("duration"),
        "genre": movie.get("genre"),
        "release_year": movie.get("release_year"),
        "is_active": movie.get("is_active", True),
        "created_at": movie["created_at"],
        "updated_at": movie.get("updated_at"),
        "views": movie.get("views", 0) + 1
    }

@router.post("", response_model=MovieResponse, status_code=status.HTTP_201_CREATED)
async def create_movie(movie: MovieCreate, current_user: dict = Depends(get_current_admin)):
    """Create a new movie (Admin only)"""
    db = Database.get_db()
    
    movie_id = str(uuid.uuid4())
    now = datetime.utcnow()
    
    # Debug: print what we received
    print(f"DEBUG: Received movie data: {movie.dict()}")
    
    movie_doc = {
        "_id": movie_id,
        "title": movie.title,
        "description": movie.description,
        "thumbnail_url": movie.thumbnail_url,
        "video_url": movie.video_url,
        "price": movie.price,
        "is_free": movie.is_free,
        "duration": movie.duration,
        "genre": movie.genre,
        "release_year": movie.release_year,
        "is_active": movie.is_active,
        "created_at": now,
        "updated_at": now,
        "views": 0
    }
    
    await db[MOVIES_COLLECTION].insert_one(movie_doc)
    
    return {
        "id": movie_id,
        "title": movie.title,
        "description": movie.description,
        "thumbnail_url": movie.thumbnail_url,
        "video_url": movie.video_url,
        "price": movie.price,
        "duration": movie.duration,
        "genre": movie.genre,
        "release_year": movie.release_year,
        "is_active": movie.is_active,
        "created_at": now,
        "updated_at": now,
        "views": 0
    }

@router.put("/{movie_id}", response_model=MovieResponse)
async def update_movie(movie_id: str, movie: MovieUpdate, current_user: dict = Depends(get_current_admin)):
    """Update a movie (Admin only)"""
    db = Database.get_db()
    
    # Check if movie exists
    existing = await db[MOVIES_COLLECTION].find_one({"_id": movie_id})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Movie not found"
        )
    
    # Build update dict
    update_data = movie.dict(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow()
    
    await db[MOVIES_COLLECTION].update_one(
        {"_id": movie_id},
        {"$set": update_data}
    )
    
    updated = await db[MOVIES_COLLECTION].find_one({"_id": movie_id})
    
    return {
        "id": updated["_id"],
        "title": updated["title"],
        "description": updated.get("description"),
        "thumbnail_url": updated.get("thumbnail_url"),
        "video_url": updated.get("video_url"),
        "price": updated["price"],
        "duration": updated.get("duration"),
        "genre": updated.get("genre"),
        "release_year": updated.get("release_year"),
        "is_active": updated.get("is_active", True),
        "created_at": updated["created_at"],
        "updated_at": updated["updated_at"],
        "views": updated.get("views", 0)
    }

@router.delete("/{movie_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_movie(movie_id: str, current_user: dict = Depends(get_current_admin)):
    """Delete a movie (Admin only)"""
    db = Database.get_db()
    
    # Check if movie exists
    existing = await db[MOVIES_COLLECTION].find_one({"_id": movie_id})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Movie not found"
        )
    
    # Soft delete - just mark as inactive
    await db[MOVIES_COLLECTION].update_one(
        {"_id": movie_id},
        {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
    )
    
    return None

@router.get("/{movie_id}/stream", response_model=StreamResponse)
async def stream_movie(movie_id: str, current_user: dict = Depends(get_current_user)):
    """Get streaming URL for a movie (requires subscription, admin can bypass, free movies open to all)"""
    db = Database.get_db()
    
    # Check if movie exists
    movie = await db[MOVIES_COLLECTION].find_one({"_id": movie_id, "is_active": True})
    if not movie:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Movie not found"
        )
    
    # Admin users can stream without subscription
    is_admin = current_user.get("is_admin", False)
    
    # Check if this is a free movie
    is_free = movie.get("is_free", False)
    
    # Check for subscription (skip for admin and free movies)
    now = datetime.utcnow()
    subscription = None
    
    if not is_admin and not is_free:
        # Check if user has active subscription
        subscription = await db[USER_SUBSCRIPTIONS_COLLECTION].find_one({
            "user_id": current_user["_id"],
            "expires_at": {"$gt": now}
        })
        
        if not subscription:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Please subscribe to watch this content"
            )
    
    # Generate streaming token
    stream_token = create_access_token(
        data={
            "sub": current_user["_id"],
            "movie_id": movie_id,
            "subscription_id": subscription["_id"] if subscription else "admin"
        },
        expires_delta=datetime.timedelta(hours=STREAM_TOKEN_EXPIRE_HOURS)
    )
    
    # Get video URL - for admin, return directly; for others get from Firebase
    video_url = movie.get("video_url", "")
    if video_url and not is_admin:
        # Generate signed URL for streaming
        video_url = firebase_service.get_video_url(movie["video_url"].split("/")[-1])
    
    # Set expiry - admin gets 48 hours, subscription users get their subscription expiry
    if subscription:
        expires_at = subscription["expires_at"]
    elif is_free:
        # Free movies get 24 hour access
        expires_at = now + datetime.timedelta(hours=FREE_TRIAL_HOURS)
    else:
        expires_at = now + datetime.timedelta(hours=STREAM_ACCESS_EXPIRE_HOURS)
    
    return {
        "movie_id": movie_id,
        "video_url": video_url,
        "token": stream_token,
        "expires_at": expires_at
    }

@router.get("/user/purchases", response_model=List[PurchaseResponse])
async def get_user_purchases(current_user: dict = Depends(get_current_user)):
    """Get all purchases for the current user"""
    db = Database.get_db()
    
    purchases_cursor = db[PURCHASES_COLLECTION].find(
        {"user_id": current_user["_id"]}
    ).sort("created_at", -1)
    
    purchases = await purchases_cursor.to_list(length=100)
    
    return [
        {
            "id": p["_id"],
            "user_id": p["user_id"],
            "movie_id": p["movie_id"],
            "payment_id": p["payment_id"],
            "created_at": p["created_at"],
            "expires_at": p["expires_at"]
        }
        for p in purchases
    ]

@router.post("/like")
async def like_movie(reaction: MovieReaction, current_user: dict = Depends(get_current_user)):
    """Like or dislike a movie"""
    db = Database.get_db()
    user_id = current_user["_id"]
    
    # Check if movie exists
    movie = await db[MOVIES_COLLECTION].find_one({"_id": reaction.movie_id})
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    # Check if user already has a reaction
    existing_reaction = await db[REACTIONS_COLLECTION].find_one({
        "movie_id": reaction.movie_id,
        "user_id": user_id
    })
    
    if existing_reaction:
        # Update existing reaction
        old_reaction = existing_reaction.get("reaction")
        await db[REACTIONS_COLLECTION].update_one(
            {"_id": existing_reaction["_id"]},
            {"$set": {"reaction": reaction.reaction}}
        )
        
        # Update movie counts
        if old_reaction != reaction.reaction:
            if old_reaction == "like":
                await db[MOVIES_COLLECTION].update_one(
                    {"_id": reaction.movie_id},
                    {"$inc": {"likes": -1}}
                )
            elif old_reaction == "dislike":
                await db[MOVIES_COLLECTION].update_one(
                    {"_id": reaction.movie_id},
                    {"$inc": {"dislikes": -1}}
                )
            
            if reaction.reaction == "like":
                await db[MOVIES_COLLECTION].update_one(
                    {"_id": reaction.movie_id},
                    {"$inc": {"likes": 1}}
                )
            elif reaction.reaction == "dislike":
                await db[MOVIES_COLLECTION].update_one(
                    {"_id": reaction.movie_id},
                    {"$inc": {"dislikes": 1}}
                )
    else:
        # Create new reaction
        reaction_id = str(uuid.uuid4())
        await db[REACTIONS_COLLECTION].insert_one({
            "_id": reaction_id,
            "movie_id": reaction.movie_id,
            "user_id": user_id,
            "reaction": reaction.reaction,
            "created_at": datetime.utcnow()
        })
        
        # Update movie counts
        if reaction.reaction == "like":
            await db[MOVIES_COLLECTION].update_one(
                {"_id": reaction.movie_id},
                {"$inc": {"likes": 1}}
            )
        elif reaction.reaction == "dislike":
            await db[MOVIES_COLLECTION].update_one(
                {"_id": reaction.movie_id},
                {"$inc": {"dislikes": 1}}
            )
    
    return {"message": "Reaction updated successfully"}

@router.post("/subscribe")
async def subscribe_movie(movie_id: str, current_user: dict = Depends(get_current_user)):
    """Subscribe to a movie for notifications"""
    db = Database.get_db()
    user_id = current_user["_id"]
    
    # Check if movie exists
    movie = await db[MOVIES_COLLECTION].find_one({"_id": movie_id})
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    # Check if already subscribed
    existing = await db[SUBSCRIPTIONS_COLLECTION].find_one({
        "movie_id": movie_id,
        "user_id": user_id
    })
    
    if existing:
        # Unsubscribe
        await db[SUBSCRIPTIONS_COLLECTION].delete_one({"_id": existing["_id"]})
        return {"message": "Unsubscribed successfully", "subscribed": False}
    else:
        # Subscribe
        subscription_id = str(uuid.uuid4())
        await db[SUBSCRIPTIONS_COLLECTION].insert_one({
            "_id": subscription_id,
            "movie_id": movie_id,
            "user_id": user_id,
            "created_at": datetime.utcnow()
        })
        return {"message": "Subscribed successfully", "subscribed": True}

@router.get("/subscriptions")
async def get_subscriptions(current_user: dict = Depends(get_current_user)):
    """Get user's movie subscriptions"""
    db = Database.get_db()
    user_id = current_user["_id"]
    
    subscriptions = await db[SUBSCRIPTIONS_COLLECTION].find(
        {"user_id": user_id}
    ).to_list(length=100)
    
    return [
        {
            "id": s["_id"],
            "movie_id": s["movie_id"],
            "user_id": s["user_id"],
            "created_at": s["created_at"]
        }
        for s in subscriptions
    ]
