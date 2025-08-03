"""
Base Redis repository implementation.
"""
import json
from abc import ABC, abstractmethod
from typing import Any, Dict, Generic, List, Optional, TypeVar, Union
from datetime import datetime

import redis.asyncio as redis
from pydantic import BaseModel

from app.models.base import PaginatedResponse, PaginationParams

T = TypeVar('T', bound=BaseModel)


class BaseRedisRepository(ABC, Generic[T]):
    """Base Redis repository with common CRUD operations."""
    
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
    
    @property
    @abstractmethod
    def entity_name(self) -> str:
        """Entity name for Redis key generation."""
        pass
    
    @abstractmethod
    def model_class(self) -> type[T]:
        """Pydantic model class for this repository."""
        pass
    
    def generate_key(self, *parts: str) -> str:
        """Generate Redis key from parts."""
        return ":".join([self.entity_name] + list(parts))
    
    def generate_list_key(self) -> str:
        """Generate list key for all entities."""
        return self.generate_key("list")
    
    def generate_index_key(self, field: str, value: str) -> str:
        """Generate index key for field-value pairs."""
        return self.generate_key("index", field, value)
    
    def serialize(self, entity: T) -> Dict[str, str]:
        """Serialize entity to Redis hash format."""
        data = entity.dict()
        # Convert all values to strings for Redis
        result = {}
        for k, v in data.items():
            if isinstance(v, str):
                result[k] = v
            elif isinstance(v, datetime):
                result[k] = v.isoformat()
            else:
                result[k] = json.dumps(v, default=str)
        return result
    
    def deserialize(self, data: Dict[str, str]) -> T:
        """Deserialize Redis hash data to entity."""
        # Convert JSON strings back to Python objects
        parsed_data = {}
        for k, v in data.items():
            try:
                parsed_data[k] = json.loads(v)
            except (json.JSONDecodeError, TypeError):
                parsed_data[k] = v
        
        return self.model_class()(**parsed_data)
    
    async def find_by_id(self, entity_id: str) -> Optional[T]:
        """Find entity by ID."""
        key = self.generate_key(entity_id)
        data = await self.redis.hgetall(key)
        
        if not data:
            return None
        
        return self.deserialize(data)
    
    async def find_all(self) -> List[T]:
        """Find all entities."""
        list_key = self.generate_list_key()
        entity_ids = await self.redis.lrange(list_key, 0, -1)
        
        if not entity_ids:
            return []
        
        # Use pipeline for efficient batch fetching
        pipe = self.redis.pipeline()
        for entity_id in entity_ids:
            key = self.generate_key(entity_id)
            pipe.hgetall(key)
        
        results = await pipe.execute()
        entities = []
        
        for data in results:
            if data:
                entities.append(self.deserialize(data))
        
        return entities
    
    async def find_paginated(
        self, 
        pagination: PaginationParams
    ) -> PaginatedResponse:
        """Find entities with pagination."""
        list_key = self.generate_list_key()
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
            key = self.generate_key(entity_id)
            pipe.hgetall(key)
        
        results = await pipe.execute()
        entities = []
        
        for data in results:
            if data:
                entities.append(self.deserialize(data))
        
        return PaginatedResponse.create(entities, total, pagination.page, pagination.limit)
    
    async def save(self, entity: T) -> T:
        """Save entity to Redis."""
        entity_id = entity.id
        key = self.generate_key(entity_id)
        list_key = self.generate_list_key()
        
        # Serialize entity data
        data = self.serialize(entity)
        
        # Use pipeline for atomic operations
        pipe = self.redis.pipeline()
        
        # Save entity data
        pipe.hset(key, mapping=data)
        
        # Add to list if not exists
        pipe.lrem(list_key, 0, entity_id)  # Remove if exists
        pipe.lpush(list_key, entity_id)    # Add to front
        
        await pipe.execute()
        
        return entity
    
    async def delete(self, entity_id: str) -> bool:
        """Delete entity by ID."""
        key = self.generate_key(entity_id)
        list_key = self.generate_list_key()
        
        # Check if entity exists
        exists = await self.redis.exists(key)
        if not exists:
            return False
        
        # Use pipeline for atomic operations
        pipe = self.redis.pipeline()
        
        # Delete entity data
        pipe.delete(key)
        
        # Remove from list
        pipe.lrem(list_key, 0, entity_id)
        
        await pipe.execute()
        
        return True
    
    async def delete_all(self) -> int:
        """Delete all entities."""
        list_key = self.generate_list_key()
        entity_ids = await self.redis.lrange(list_key, 0, -1)
        
        if not entity_ids:
            return 0
        
        # Use pipeline for efficient batch deletion
        pipe = self.redis.pipeline()
        
        # Delete all entity data
        for entity_id in entity_ids:
            key = self.generate_key(entity_id)
            pipe.delete(key)
        
        # Clear the list
        pipe.delete(list_key)
        
        await pipe.execute()
        
        return len(entity_ids)
    
    async def exists(self, entity_id: str) -> bool:
        """Check if entity exists."""
        key = self.generate_key(entity_id)
        return bool(await self.redis.exists(key))
    
    async def count(self) -> int:
        """Count total entities."""
        list_key = self.generate_list_key()
        return await self.redis.llen(list_key)
    
    async def find_by_field(
        self, 
        field: str, 
        value: Union[str, int, bool]
    ) -> List[T]:
        """Find entities by field value (requires indexing)."""
        index_key = self.generate_index_key(field, str(value))
        entity_ids = await self.redis.smembers(index_key)
        
        if not entity_ids:
            return []
        
        # Fetch entities
        pipe = self.redis.pipeline()
        for entity_id in entity_ids:
            key = self.generate_key(entity_id)
            pipe.hgetall(key)
        
        results = await pipe.execute()
        entities = []
        
        for data in results:
            if data:
                entities.append(self.deserialize(data))
        
        return entities
    
    async def create_index(self, entity: T, field: str, value: str) -> None:
        """Create index for field-value pair."""
        index_key = self.generate_index_key(field, value)
        await self.redis.sadd(index_key, entity.id)
    
    async def remove_index(self, entity_id: str, field: str, value: str) -> None:
        """Remove from index."""
        index_key = self.generate_index_key(field, value)
        await self.redis.srem(index_key, entity_id)