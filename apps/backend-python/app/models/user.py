"""
User domain models.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

from .base import BaseEntityModel


class User(BaseEntityModel):
    """User entity model."""
    
    email: EmailStr
    name: Optional[str] = None
    password_hash: str
    email_verified: bool = False
    is_active: bool = True
    
    @classmethod
    def generate_id(cls) -> str:
        """Generate a new user ID."""
        from uuid import uuid4
        return str(uuid4())


class UserCreate(BaseModel):
    """User creation model."""
    
    email: EmailStr
    name: str = Field(..., min_length=1, max_length=100)
    password: str = Field(..., min_length=8, max_length=100)
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        if not v or not v.strip():
            raise ValueError('Name cannot be empty')
        return v.strip()


class UserUpdate(BaseModel):
    """User update model."""
    
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        if v is not None and (not v or not v.strip()):
            raise ValueError('Name cannot be empty')
        return v.strip() if v else v


class UserProfile(BaseModel):
    """User profile response model."""
    
    id: str
    email: EmailStr
    name: Optional[str]
    email_verified: bool
    created_at: datetime


class ChangePasswordRequest(BaseModel):
    """Change password request model."""
    
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8, max_length=100)