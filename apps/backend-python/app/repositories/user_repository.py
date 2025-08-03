"""
User repository implementation.
"""
from typing import Optional

import redis.asyncio as redis

from app.models.user import User
from .base_redis import BaseRedisRepository


class UserRepository(BaseRedisRepository[User]):
    """User repository with Redis backend."""
    
    def __init__(self, redis_client: redis.Redis):
        super().__init__(redis_client)
    
    @property
    def entity_name(self) -> str:
        return "user"
    
    def model_class(self) -> type[User]:
        return User
    
    async def find_by_email(self, email: str) -> Optional[User]:
        """Find user by email address."""
        return await self.find_by_field_for_unique_index("email", email)
    
    async def find_by_field_for_unique_index(
        self, 
        field: str, 
        value: str
    ) -> Optional[User]:
        """Find user by unique indexed field."""
        index_key = self.generate_index_key(field, value)
        entity_id = await self.redis.get(index_key)
        
        if not entity_id:
            return None
        
        return await self.find_by_id(entity_id)
    
    async def save(self, user: User) -> User:
        """Save user with email index."""
        # Save the user entity
        result = await super().save(user)
        
        # Create unique email index
        email_index_key = self.generate_index_key("email", user.email)
        await self.redis.set(email_index_key, user.id)
        
        return result
    
    async def delete(self, user_id: str) -> bool:
        """Delete user and remove email index."""
        # Get user to remove email index
        user = await self.find_by_id(user_id)
        if not user:
            return False
        
        # Remove email index
        email_index_key = self.generate_index_key("email", user.email)
        await self.redis.delete(email_index_key)
        
        # Delete the user entity
        return await super().delete(user_id)
    
    async def update_email(self, user_id: str, old_email: str, new_email: str) -> bool:
        """Update user email and maintain email index."""
        # Check if new email is already taken
        existing_user = await self.find_by_email(new_email)
        if existing_user and existing_user.id != user_id:
            return False
        
        # Get user
        user = await self.find_by_id(user_id)
        if not user:
            return False
        
        # Update user email
        user.email = new_email
        
        # Use pipeline for atomic operations
        pipe = self.redis.pipeline()
        
        # Save updated user
        user_key = self.generate_key(user_id)
        data = self.serialize(user)
        pipe.hset(user_key, mapping=data)
        
        # Update email index
        old_email_index = self.generate_index_key("email", old_email)
        new_email_index = self.generate_index_key("email", new_email)
        pipe.delete(old_email_index)
        pipe.set(new_email_index, user_id)
        
        await pipe.execute()
        
        return True