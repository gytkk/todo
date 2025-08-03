"""
User-related request/response schemas.
"""
from pydantic import BaseModel, Field

from app.models.user import UserProfile, ChangePasswordRequest as ModelChangePasswordRequest


class UserProfileResponse(BaseModel):
    """User profile response schema."""
    
    user: UserProfile


class UpdateUserProfileRequest(BaseModel):
    """Update user profile request schema."""
    
    name: str = Field(..., min_length=1, max_length=100)


class UserUpdate(BaseModel):
    """User update schema for service layer."""
    
    name: str = Field(..., min_length=1, max_length=100)


class ChangePasswordRequest(ModelChangePasswordRequest):
    """Change password request schema."""
    pass  # Inherit from model


class ChangePasswordResponse(BaseModel):
    """Change password response schema."""
    
    message: str = "Password changed successfully"