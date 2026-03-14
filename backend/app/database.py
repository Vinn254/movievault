from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()

class Database:
    client: Optional[AsyncIOMotorClient] = None
    
    @classmethod
    async def connect(cls):
        """Connect to MongoDB"""
        mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/movievault")
        cls.client = AsyncIOMotorClient(mongo_uri)
        
    @classmethod
    def get_db(cls):
        """Get database instance"""
        return cls.client.movievault
    
    @classmethod
    async def close(cls):
        """Close MongoDB connection"""
        if cls.client:
            cls.client.close()

# Collections
USERS_COLLECTION = "users"
MOVIES_COLLECTION = "movies"
PAYMENTS_COLLECTION = "payments"
PURCHASES_COLLECTION = "purchases"
REACTIONS_COLLECTION = "reactions"
SUBSCRIPTIONS_COLLECTION = "subscriptions"
