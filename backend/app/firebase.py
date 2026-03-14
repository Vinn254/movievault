import os
import cloudinary
from cloudinary import api
from dotenv import load_dotenv

load_dotenv()

class CloudinaryService:
    def __init__(self):
        self.cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
        self.api_key = os.getenv("CLOUDINARY_API_KEY")
        self.api_secret = os.getenv("CLOUDINARY_API_SECRET")
        self.initialized = False
    
    def initialize(self):
        """Initialize Cloudinary"""
        if self.initialized:
            return
        
        try:
            cloudinary.config(
                cloud_name=self.cloud_name,
                api_key=self.api_key,
                api_secret=self.api_secret
            )
            self.initialized = True
            print("Cloudinary initialized successfully")
        except Exception as e:
            print(f"Cloudinary initialization warning: {e}")
            print("Video uploads will use placeholder URLs.")
    
    def upload_video(self, file_data: bytes, file_name: str, content_type: str = "video/mp4") -> str:
        """Upload video to Cloudinary"""
        if not self.initialized:
            self.initialize()
        
        if not self.initialized:
            # Return placeholder URL if Cloudinary not configured
            return f"https://res.cloudinary.com/{self.cloud_name}/video/upload/movies/{file_name}"
        
        try:
            # Upload to Cloudinary
            result = cloudinary.uploader.upload(
                f"data:{content_type};base64,{file_data.hex()}",
                resource_type="video",
                folder="movies",
                public_id=file_name.split('.')[0]
            )
            return result.get('secure_url', '')
        except Exception as e:
            print(f"Cloudinary upload error: {e}")
            return f"https://res.cloudinary.com/{self.cloud_name}/video/upload/movies/{file_name}"
    
    def get_video_url(self, file_name: str, expiration_minutes: int = 60) -> str:
        """Get streaming URL for video"""
        if not self.initialized:
            self.initialize()
        
        if not self.initialized:
            return f"https://res.cloudinary.com/{self.cloud_name}/video/upload/movies/{file_name}"
        
        try:
            # Generate optimized streaming URL
            result = cloudinary.api.resource(
                f"movies/{file_name.split('.')[0]}",
                resource_type="video"
            )
            # Return the streaming URL with transformations for optimal playback
            public_id = result.get('public_id')
            return f"https://res.cloudinary.com/{self.cloud_name}/video/upload/ac_none,vc_h265,w_1280/{public_id}.mp4"
        except Exception as e:
            print(f"Cloudinary URL generation error: {e}")
            return f"https://res.cloudinary.com/{self.cloud_name}/video/upload/movies/{file_name}"
    
    def delete_video(self, file_name: str) -> bool:
        """Delete video from Cloudinary"""
        if not self.initialized:
            self.initialize()
        
        if not self.initialized:
            return False
        
        try:
            public_id = f"movies/{file_name.split('.')[0]}"
            cloudinary.uploader.destroy(public_id)
            return True
        except Exception:
            return False
    
    def upload_thumbnail(self, file_data: bytes, file_name: str, content_type: str = "image/jpeg") -> str:
        """Upload thumbnail image to Cloudinary"""
        if not self.initialized:
            self.initialize()
        
        if not self.initialized:
            return f"https://res.cloudinary.com/{self.cloud_name}/image/upload/thumbnails/{file_name}"
        
        try:
            # Upload to Cloudinary
            result = cloudinary.uploader.upload(
                f"data:{content_type};base64,{file_data.hex()}",
                resource_type="image",
                folder="thumbnails",
                public_id=file_name.split('.')[0]
            )
            return result.get('secure_url', '')
        except Exception as e:
            print(f"Cloudinary thumbnail upload error: {e}")
            return f"https://res.cloudinary.com/{self.cloud_name}/image/upload/thumbnails/{file_name}"

# Create singleton instance
cloudinary_service = CloudinaryService()

# Alias for backward compatibility
firebase_service = cloudinary_service
