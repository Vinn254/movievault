from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime

from app.database import Database, USERS_COLLECTION, MOVIES_COLLECTION, PAYMENTS_COLLECTION, PURCHASES_COLLECTION
from app.schemas import AdminStats, MovieResponse, UserResponse
from app.routes.auth import get_current_admin

router = APIRouter(prefix="/api/admin", tags=["Admin"])

import os
ADMIN_SECRET = os.getenv("ADMIN_SECRET", "admin-secret-key")

@router.post("/fix-movie/{movie_id}")
async def fix_movie_free(movie_id: str, is_free: bool = True):
    """Fix movie is_free flag - debug endpoint"""
    db = Database.get_db()
    
    result = await db[MOVIES_COLLECTION].update_one(
        {"_id": movie_id},
        {"$set": {"is_free": is_free, "updated_at": datetime.utcnow()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    return {"message": f"Movie {movie_id} updated with is_free={is_free}"}

@router.post("/promote/{user_id}")
async def promote_to_admin(
    user_id: str,
    secret: str
):
    """Promote a user to admin (requires secret key)"""
    if secret != ADMIN_SECRET:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid secret key"
        )
    
    db = Database.get_db()
    
    result = await db[USERS_COLLECTION].update_one(
        {"_id": user_id},
        {"$set": {"is_admin": True}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {"message": "User promoted to admin", "user_id": user_id}

@router.get("/stats", response_model=AdminStats)
async def get_admin_stats(current_user: dict = Depends(get_current_admin)):
    """Get admin dashboard statistics"""
    db = Database.get_db()
    
    # Total users
    total_users = await db[USERS_COLLECTION].count_documents({})
    
    # Total movies
    total_movies = await db[MOVIES_COLLECTION].count_documents({})
    
    # Total payments (completed)
    payment_pipeline = [
        {"$match": {"status": "completed"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    payment_result = await db[PAYMENTS_COLLECTION].aggregate(payment_pipeline).to_list(length=1)
    total_payments = payment_result[0]["total"] if payment_result else 0
    
    # Total purchases
    total_purchases = await db[PURCHASES_COLLECTION].count_documents({})
    
    return {
        "total_users": total_users,
        "total_movies": total_movies,
        "total_payments": total_payments,
        "total_purchases": total_purchases
    }

@router.get("/users", response_model=List[UserResponse])
async def get_all_users(
    skip: int = 0,
    limit: int = 50,
    current_user: dict = Depends(get_current_admin)
):
    """Get all users (Admin only)"""
    db = Database.get_db()
    
    users_cursor = db[USERS_COLLECTION].find().skip(skip).limit(limit).sort("created_at", -1)
    users = await users_cursor.to_list(length=limit)
    
    return [
        {
            "id": u["_id"],
            "email": u["email"],
            "username": u["username"],
            "full_name": u.get("full_name"),
            "is_admin": u.get("is_admin", False),
            "created_at": u["created_at"],
            "updated_at": u.get("updated_at")
        }
        for u in users
    ]

@router.get("/payments", response_model=List[dict])
async def get_all_payments(
    skip: int = 0,
    limit: int = 50,
    current_user: dict = Depends(get_current_admin)
):
    """Get all payment records (Admin only)"""
    db = Database.get_db()
    
    payments_cursor = db[PAYMENTS_COLLECTION].find().skip(skip).limit(limit).sort("created_at", -1)
    payments = await payments_cursor.to_list(length=limit)
    
    return [
        {
            "id": p["_id"],
            "user_id": p["user_id"],
            "movie_id": p["movie_id"],
            "phone_number": p.get("phone_number"),
            "amount": p["amount"],
            "status": p["status"],
            "mpesa_receipt_number": p.get("mpesa_receipt_number"),
            "created_at": p["created_at"]
        }
        for p in payments
    ]

@router.get("/purchases", response_model=List[dict])
async def get_all_purchases(
    skip: int = 0,
    limit: int = 50,
    current_user: dict = Depends(get_current_admin)
):
    """Get all purchase records (Admin only)"""
    db = Database.get_db()
    
    purchases_cursor = db[PURCHASES_COLLECTION].find().skip(skip).limit(limit).sort("created_at", -1)
    purchases = await purchases_cursor.to_list(length=limit)
    
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
