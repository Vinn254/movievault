from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

from app.database import Database
from app.routes import auth, movies, payments, admin

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    await Database.connect()
    print("Connected to MongoDB")
    yield
    # Shutdown
    await Database.close()
    print("Disconnected from MongoDB")

# Create FastAPI application
app = FastAPI(
    title="MovieVault API",
    description="Movie streaming platform with M-Pesa payment integration",
    version="1.0.0",
    lifespan=lifespan
)

# Debug endpoint to fix movie is_free
@app.post("/debug-fix-movie/{movie_id}")
async def debug_fix_movie(movie_id: str, is_free: bool = True):
    """Debug endpoint to fix movie is_free flag"""
    from app.database import Database
    db = Database.get_db()
    
    result = await db["movies"].update_one(
        {"_id": movie_id},
        {"$set": {"is_free": is_free}}
    )
    
    if result.matched_count == 0:
        return {"error": "Movie not found"}
    
    return {"message": f"Movie {movie_id} updated with is_free={is_free}"}

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(movies.router)
app.include_router(payments.router)
app.include_router(admin.router)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "MovieVault API",
        "version": "1.0.0",
        "description": "Movie streaming platform with M-Pesa payment integration"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

# Error handlers
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    return {
        "status_code": 500,
        "detail": f"Internal server error: {str(exc)}"
    }
