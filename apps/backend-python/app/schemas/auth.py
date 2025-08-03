"""
Authentication request/response schemas.
"""
from typing import Optional

from pydantic import BaseModel, EmailStr, Field

from app.models.user import UserProfile
from app.models.user_settings import UserSettings


class LoginRequest(BaseModel):
    """Login request schema."""
    
    email: EmailStr
    password: str = Field(..., min_length=1)
    remember_me: bool = False


class RegisterRequest(BaseModel):
    """Registration request schema."""
    
    email: EmailStr
    name: str = Field(..., min_length=1, max_length=100)
    password: str = Field(..., min_length=8, max_length=100)


class RefreshTokenRequest(BaseModel):
    """Refresh token request schema."""
    
    refresh_token: str = Field(..., min_length=1)


class TokenResponse(BaseModel):
    """Token response schema."""
    
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class AuthResponse(BaseModel):
    """Authentication response schema."""
    
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserProfile
    user_settings: UserSettings


class LogoutResponse(BaseModel):
    """Logout response schema."""
    
    message: str = "Logged out successfully"