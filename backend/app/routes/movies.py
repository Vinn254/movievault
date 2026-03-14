from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime
import uuid

from app.database import Database, MOVIES_COLLECTION, PURCHASES_COLLECTION, REACTIONS_COLLECTION, SUBSCRIPTIONS_COLLECTION
from app.schemas import (
    MovieCreate, MovieUpdate, MovieResponse, MovieListResponse,
    StreamResponse, PurchaseResponse, MovieReaction, SubscriptionResponse
)
from app.routes.auth import get_current_user, get_current_admin
from app.firebase import firebase_service
from app.auth import create_access_token

router = APIRouter(prefix="/api/movies", tags=["Movies"])

# Debug endpoint to fix is_free
@router.get("/debug-fix/{movie_id}")
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

# Streaming token expiry (24 hours)
STREAM_TOKEN_EXPIRE_HOURS = 24
STREAM_ACCESS_EXPIRE_HOURS = 48  # How long user can watch after payment

@router.get("", response_model=MovieListResponse)
async def get_movies(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    genre: Optional[str] = None,
    search: Optional[str] = None
):
    """Get all movies with optional filtering"""
    db = Database.get_db()
    
    # Build query
    query = {"is_active": True}
    
    if genre:
        query["genre"] = genre
    
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
            "duration": movie.get("duration"),
            "genre": movie.get("genre"),
            "release_year": movie.get("release_year"),
            "is_active": movie.get("is_active", True),
            "created_at": movie["created_at"],
            "updated_at": movie.get("updated_at"),
            "views": movie.get("views", 0)
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
    """Get streaming URL for a movie (requires purchase, admin can bypass, free movies open to all)"""
    db = Database.get_db()
    
    # Check if movie exists
    movie = await db[MOVIES_COLLECTION].find_one({"_id": movie_id, "is_active": True})
    if not movie:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Movie not found"
        )
    
    # Admin users can stream without purchase
    is_admin = current_user.get("is_admin", False)
    
    # Check if this is a free movie
    is_free = movie.get("is_free", False)
    
    # Check if user has purchased this movie and it's still valid (skip for admin and free movies)
    now = datetime.utcnow()
    purchase = None
    
    if not is_admin and not is_free:
        purchase = await db[PURCHASES_COLLECTION].find_one({
            "user_id": current_user["_id"],
            "movie_id": movie_id,
            "expires_at": {"$gt": now}
        })
        
        if not purchase:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Please purchase this movie to stream it"
            )
    
    # Generate streaming token
    stream_token = create_access_token(
        data={
            "sub": current_user["_id"],
            "movie_id": movie_id,
            "purchase_id": purchase["_id"] if purchase else "admin"
        },
        expires_delta=datetime.timedelta(hours=STREAM_TOKEN_EXPIRE_HOURS)
    )
    
    # Get video URL - for admin, return directly; for others get from Firebase
    video_url = movie.get("video_url", "")
    if video_url and not is_admin:
        # Generate signed URL for streaming
        video_url = firebase_service.get_video_url(movie["video_url"].split("/")[-1])
    
    # Set expiry - admin gets 48 hours
    expires_at = purchase["expires_at"] if purchase else (now + datetime.timedelta(hours=STREAM_ACCESS_EXPIRE_HOURS))
    
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
