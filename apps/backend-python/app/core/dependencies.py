"""
FastAPI dependencies for database connections, authentication, etc.
"""
from typing import AsyncGenerator, Optional

import redis.asyncio as redis
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.config import settings
from app.core.security import verify_token
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.repositories.user_settings_repository import UserSettingsRepository
from app.repositories.category_repository import CategoryRepository
from app.repositories.todo_repository import TodoRepository
from app.services.auth_service import AuthService
from app.services.user_service import UserService
from app.services.todo_service import TodoService
from app.services.user_settings_service import UserSettingsService

# HTTP Bearer token scheme
security = HTTPBearer()

# Redis connection pool
_redis_pool: Optional[redis.ConnectionPool] = None


async def get_redis_pool() -> redis.ConnectionPool:
    """Get or create Redis connection pool."""
    global _redis_pool
    if _redis_pool is None:
        _redis_pool = redis.ConnectionPool.from_url(
            settings.redis_url,
            encoding="utf-8",
            decode_responses=True,
            max_connections=10,
        )
    return _redis_pool


async def get_redis_client() -> AsyncGenerator[redis.Redis, None]:
    """Get Redis client from connection pool."""
    pool = await get_redis_pool()
    client = redis.Redis(connection_pool=pool)
    try:
        yield client
    finally:
        await client.close()


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    """
    Extract and verify JWT token to get current user ID.
    
    Raises:
        HTTPException: If token is invalid or missing.
    """
    token = credentials.credentials
    user_id = verify_token(token, token_type="access")
    
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user_id


async def get_current_user_id_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Optional[str]:
    """
    Extract and verify JWT token to get current user ID, but allow None.
    
    This is useful for endpoints that work both with authenticated and 
    unauthenticated users.
    """
    if credentials is None:
        return None
    
    token = credentials.credentials
    return verify_token(token, token_type="access")


def verify_refresh_token(token: str) -> str:
    """
    Verify refresh token and return user ID.
    
    Args:
        token: JWT refresh token
        
    Returns:
        User ID if token is valid
        
    Raises:
        HTTPException: If token is invalid
    """
    user_id = verify_token(token, token_type="refresh")
    
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )
    
    return user_id


# Service Dependencies

async def get_user_repository(
    redis_client: redis.Redis = Depends(get_redis_client),
) -> UserRepository:
    """Get user repository."""
    return UserRepository(redis_client)


async def get_user_settings_repository(
    redis_client: redis.Redis = Depends(get_redis_client),
) -> UserSettingsRepository:
    """Get user settings repository."""
    return UserSettingsRepository(redis_client)


async def get_category_repository(
    redis_client: redis.Redis = Depends(get_redis_client),
) -> CategoryRepository:
    """Get category repository."""
    return CategoryRepository(redis_client)


async def get_todo_repository(
    redis_client: redis.Redis = Depends(get_redis_client),
) -> TodoRepository:
    """Get todo repository."""
    return TodoRepository(redis_client)


async def get_auth_service(
    user_repository: UserRepository = Depends(get_user_repository),
    user_settings_repository: UserSettingsRepository = Depends(get_user_settings_repository),
    redis_client: redis.Redis = Depends(get_redis_client),
) -> AuthService:
    """Get auth service."""
    return AuthService(user_repository, user_settings_repository, redis_client)


async def get_user_service(
    user_repository: UserRepository = Depends(get_user_repository),
) -> UserService:
    """Get user service."""
    return UserService(user_repository)


async def get_todo_service(
    todo_repository: TodoRepository = Depends(get_todo_repository),
    category_repository: CategoryRepository = Depends(get_category_repository),
) -> TodoService:
    """Get todo service."""
    return TodoService(todo_repository, category_repository)


async def get_user_settings_service(
    user_settings_repository: UserSettingsRepository = Depends(get_user_settings_repository),
    category_repository: CategoryRepository = Depends(get_category_repository),
) -> UserSettingsService:
    """Get user settings service."""
    return UserSettingsService(user_settings_repository, category_repository)


async def get_current_user(
    user_id: str = Depends(get_current_user_id),
    user_repository: UserRepository = Depends(get_user_repository),
) -> User:
    """Get current authenticated user."""
    user = await user_repository.find_by_id(user_id)
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )
    return user