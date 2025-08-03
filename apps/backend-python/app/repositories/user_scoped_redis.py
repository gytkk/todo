"""
User-scoped Redis repository implementation.
"""
from abc import abstractmethod
from typing import List, Optional, Union

import redis.asyncio as redis
from pydantic import BaseModel

from app.models.base import PaginatedResponse, PaginationParams
from .base_redis import BaseRedisRepository, T


class UserScopedRedisRepository(BaseRedisRepository[T]):
    """User-scoped Redis repository with user isolation."""
    
    def __init__(self, redis_client: redis.Redis):
        super().__init__(redis_client)
    
    def generate_user_key(self, user_id: str, *parts: str) -> str:
        """Generate user-scoped Redis key."""
        return ":".join(["user", user_id, self.entity_name] + list(parts))
    
    def generate_user_list_key(self, user_id: str) -> str:
        """Generate user-scoped list key."""
        return self.generate_user_key(user_id, "list")
    
    def generate_user_index_key(self, user_id: str, field: str, value: str) -> str:
        """Generate user-scoped index key."""
        return self.generate_user_key(user_id, "index", field, value)
    
    async def find_by_id_for_user(self, user_id: str, entity_id: str) -> Optional[T]:
        """Find entity by ID for specific user."""
        key = self.generate_user_key(user_id, entity_id)
        data = await self.redis.hgetall(key)
        
        if not data:
            return None
        
        return self.deserialize(data)
    
    async def find_all_for_user(self, user_id: str) -> List[T]:
        """Find all entities for specific user."""
        list_key = self.generate_user_list_key(user_id)
        entity_ids = await self.redis.lrange(list_key, 0, -1)
        
        if not entity_ids:
            return []
        
        # Use pipeline for efficient batch fetching
        pipe = self.redis.pipeline()
        for entity_id in entity_ids:
            key = self.generate_user_key(user_id, entity_id)
            pipe.hgetall(key)
        
        results = await pipe.execute()
        entities = []
        
        for data in results:
            if data:
                entities.append(self.deserialize(data))
        
        return entities
    
    async def find_paginated_for_user(
        self, 
        user_id: str,
        pagination: PaginationParams
    ) -> PaginatedResponse:
        """Find entities with pagination for specific user."""
        list_key = self.generate_user_list_key(user_id)
        total = await self.redis.llen(list_key)
        
        if total == 0:
            return PaginatedResponse.create([], 0, pagination.page, pagination.limit)
        
        # Get paginated IDs
        start = pagination.offset
        end = start + pagination.limit - 1
        entity_ids = await self.redis.lrange(list_key, start, end)
        
        if not entity_ids:
            return PaginatedResponse.create([], total, pagination.page, pagination.limit)
        
        # Fetch entities
        pipe = self.redis.pipeline()
        for entity_id in entity_ids:
            key = self.generate_user_key(user_id, entity_id)
            pipe.hgetall(key)
        
        results = await pipe.execute()
        entities = []
        
        for data in results:
            if data:
                entities.append(self.deserialize(data))
        
        return PaginatedResponse.create(entities, total, pagination.page, pagination.limit)
    
    async def save_for_user(self, user_id: str, entity: T) -> T:
        """Save entity for specific user."""
        entity_id = entity.id
        key = self.generate_user_key(user_id, entity_id)
        list_key = self.generate_user_list_key(user_id)
        
        # Serialize entity data
        data = self.serialize(entity)
        
        # Use pipeline for atomic operations
        pipe = self.redis.pipeline()
        
        # Save entity data
        pipe.hset(key, mapping=data)
        
        # Add to user's list if not exists
        pipe.lrem(list_key, 0, entity_id)  # Remove if exists
        pipe.lpush(list_key, entity_id)    # Add to front
        
        await pipe.execute()
        
        return entity
    
    async def delete_for_user(self, user_id: str, entity_id: str) -> bool:
        """Delete entity by ID for specific user."""
        key = self.generate_user_key(user_id, entity_id)
        list_key = self.generate_user_list_key(user_id)
        
        # Check if entity exists
        exists = await self.redis.exists(key)
        if not exists:
            return False
        
        # Use pipeline for atomic operations
        pipe = self.redis.pipeline()
        
        # Delete entity data
        pipe.delete(key)
        
        # Remove from user's list
        pipe.lrem(list_key, 0, entity_id)
        
        await pipe.execute()
        
        return True
    
    async def delete_all_for_user(self, user_id: str) -> int:
        """Delete all entities for specific user."""
        list_key = self.generate_user_list_key(user_id)
        entity_ids = await self.redis.lrange(list_key, 0, -1)
        
        if not entity_ids:
            return 0
        
        # Use pipeline for efficient batch deletion
        pipe = self.redis.pipeline()
        
        # Delete all entity data
        for entity_id in entity_ids:
            key = self.generate_user_key(user_id, entity_id)
            pipe.delete(key)
        
        # Clear the user's list
        pipe.delete(list_key)
        
        await pipe.execute()
        
        return len(entity_ids)
    
    async def exists_for_user(self, user_id: str, entity_id: str) -> bool:
        """Check if entity exists for specific user."""
        key = self.generate_user_key(user_id, entity_id)
        return bool(await self.redis.exists(key))
    
    async def count_for_user(self, user_id: str) -> int:
        """Count total entities for specific user."""
        list_key = self.generate_user_list_key(user_id)
        return await self.redis.llen(list_key)
    
    async def find_by_field_for_user(
        self, 
        user_id: str,
        field: str, 
        value: Union[str, int, bool]
    ) -> List[T]:
        """Find entities by field value for specific user."""
        index_key = self.generate_user_index_key(user_id, field, str(value))
        entity_ids = await self.redis.smembers(index_key)
        
        if not entity_ids:
            return []
        
        # Fetch entities
        pipe = self.redis.pipeline()
        for entity_id in entity_ids:
            key = self.generate_user_key(user_id, entity_id)
            pipe.hgetall(key)
        
        results = await pipe.execute()
        entities = []
        
        for data in results:
            if data:
                entities.append(self.deserialize(data))
        
        return entities
    
    async def create_user_index(
        self, 
        user_id: str, 
        entity: T, 
        field: str, 
        value: str
    ) -> None:
        """Create index for field-value pair for specific user."""
        index_key = self.generate_user_index_key(user_id, field, value)
        await self.redis.sadd(index_key, entity.id)
    
    async def remove_user_index(
        self, 
        user_id: str,
        entity_id: str, 
        field: str, 
        value: str
    ) -> None:
        """Remove from index for specific user."""
        index_key = self.generate_user_index_key(user_id, field, value)
        await self.redis.srem(index_key, entity_id)