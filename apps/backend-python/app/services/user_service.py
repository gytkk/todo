"""
User service for user management operations.
"""
from typing import Optional
from datetime import datetime

from app.core.security import verify_password, get_password_hash, validate_password_strength
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserUpdate, ChangePasswordRequest, UserProfile


class UserService:
    """Service for user management operations."""
    
    def __init__(self, user_repository: UserRepository):
        self.user_repository = user_repository
    
    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        """Get user by ID."""
        return await self.user_repository.find_by_id(user_id)
    
    async def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email."""
        return await self.user_repository.find_by_email(email)
    
    async def update_user(self, user_id: str, update_data: UserUpdate) -> UserProfile:
        """Update user information."""
        user = await self.user_repository.find_by_id(user_id)
        if not user:
            raise ValueError("User not found")
        
        # Update only provided fields
        if update_data.name is not None:
            user.name = update_data.name
        
        user.updated_at = datetime.utcnow()
        
        await self.user_repository.save(user)
        
        return UserProfile(
            id=user.id,
            email=user.email,
            name=user.name,
            email_verified=user.email_verified,
            created_at=user.created_at,
        )
    
    async def change_password(
        self, user_id: str, change_password_data: ChangePasswordRequest
    ) -> None:
        """Change user password."""
        user = await self.user_repository.find_by_id(user_id)
        if not user:
            raise ValueError("User not found")
        
        # Verify current password
        if not verify_password(
            change_password_data.current_password, user.password_hash
        ):
            raise ValueError("Current password is incorrect")
        
        # Validate new password strength
        is_valid, errors = validate_password_strength(
            change_password_data.new_password
        )
        if not is_valid:
            raise ValueError(f"Password validation failed: {', '.join(errors)}")
        
        # Hash new password
        user.password_hash = get_password_hash(change_password_data.new_password)
        user.updated_at = datetime.utcnow()
        
        await self.user_repository.save(user)
    
    async def delete_user(self, user_id: str) -> None:
        """Delete user account."""
        user = await self.user_repository.find_by_id(user_id)
        if not user:
            raise ValueError("User not found")
        
        # Delete user
        deleted = await self.user_repository.delete(user_id)
        if not deleted:
            raise ValueError("Failed to delete user")
    
    async def get_user_profile(self, user_id: str) -> UserProfile:
        """Get user profile information."""
        user = await self.user_repository.find_by_id(user_id)
        if not user:
            raise ValueError("User not found")
        
        return UserProfile(
            id=user.id,
            email=user.email,
            name=user.name,
            email_verified=user.email_verified,
            created_at=user.created_at,
        )