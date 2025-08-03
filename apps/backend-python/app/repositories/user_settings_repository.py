"""
User settings repository implementation.
"""
from typing import Dict, Optional

import redis.asyncio as redis

from app.models.user_settings import UserSettings
from .base_redis import BaseRedisRepository


class UserSettingsRepository(BaseRedisRepository[UserSettings]):
    """User settings repository with Redis backend."""
    
    def __init__(self, redis_client: redis.Redis):
        super().__init__(redis_client)
    
    @property
    def entity_name(self) -> str:
        return "user_settings"
    
    def model_class(self) -> type[UserSettings]:
        return UserSettings
    
    def generate_user_settings_key(self, user_id: str) -> str:
        """Generate Redis key for user settings."""
        return f"user:{user_id}:settings"
    
    async def find_by_user_id(self, user_id: str) -> Optional[UserSettings]:
        """Find settings by user ID."""
        key = self.generate_user_settings_key(user_id)
        data = await self.redis.hgetall(key)
        
        if not data:
            return None
        
        return self.deserialize(data)
    
    async def save_for_user(self, user_id: str, settings: UserSettings) -> UserSettings:
        """Save settings for specific user."""
        # Ensure user_id is set
        settings.user_id = user_id
        
        key = self.generate_user_settings_key(user_id)
        data = self.serialize(settings)
        
        await self.redis.hset(key, mapping=data)
        
        return settings
    
    async def delete_for_user(self, user_id: str) -> bool:
        """Delete settings for specific user."""
        key = self.generate_user_settings_key(user_id)
        
        exists = await self.redis.exists(key)
        if not exists:
            return False
        
        await self.redis.delete(key)
        return True
    
    async def update_partial_for_user(
        self, 
        user_id: str, 
        updates: Dict[str, any]
    ) -> Optional[UserSettings]:
        """Update partial settings for user."""
        # Get current settings
        settings = await self.find_by_user_id(user_id)
        if not settings:
            # Create default settings if not exist
            settings = UserSettings(user_id=user_id)
        
        # Apply updates
        for key, value in updates.items():
            if hasattr(settings, key):
                setattr(settings, key, value)
        
        # Save updated settings
        return await self.save_for_user(user_id, settings)
    
    async def create_default_settings(self, user_id: str) -> UserSettings:
        """Create default settings for user."""
        # Create default settings
        default_settings = UserSettings(user_id=user_id)
        
        # Save default settings
        return await self.save_for_user(user_id, default_settings)
    
    async def reset_to_defaults_for_user(self, user_id: str) -> UserSettings:
        """Reset settings to defaults for user."""
        # Create default settings
        default_settings = UserSettings(user_id=user_id)
        
        # Save default settings
        return await self.save_for_user(user_id, default_settings)
    
    async def get_category_filter_for_user(self, user_id: str) -> Dict[str, bool]:
        """Get category filter settings for user."""
        settings = await self.find_by_user_id(user_id)
        return settings.category_filter if settings else {}
    
    async def update_category_filter_for_user(
        self, 
        user_id: str, 
        category_filter: Dict[str, bool]
    ) -> Optional[UserSettings]:
        """Update category filter for user."""
        return await self.update_partial_for_user(
            user_id, 
            {"category_filter": category_filter}
        )
    
    async def export_data_for_user(self, user_id: str) -> Dict:
        """Export all user data."""
        settings = await self.find_by_user_id(user_id)
        if not settings:
            return {}
        
        return settings.dict()
    
    async def import_data_for_user(
        self, 
        user_id: str, 
        data: Dict
    ) -> UserSettings:
        """Import user data."""
        # Validate and create settings from imported data
        data["user_id"] = user_id  # Ensure user_id is correct
        
        try:
            settings = UserSettings(**data)
        except Exception:
            # If import fails, create default settings
            settings = UserSettings(user_id=user_id)
        
        return await self.save_for_user(user_id, settings)