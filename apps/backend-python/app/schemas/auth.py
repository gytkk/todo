"""
Authentication request/response schemas.
"""
from typing import Optional

from pydantic import BaseModel, EmailStr, Field

from app.models.user import UserProfile
from app.models.user_settings import UserSettings


class LoginRequest(BaseModel):
    """Login request schema."""
    
    email: EmailStr = Field(..., description="사용자 이메일 주소", example="user@example.com")
    password: str = Field(..., min_length=1, description="사용자 비밀번호", example="password123!")
    remember_me: bool = Field(False, description="로그인 상태 유지 여부", example=False)

    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "password": "password123!",
                "remember_me": False
            }
        }


class RegisterRequest(BaseModel):
    """Registration request schema."""
    
    email: EmailStr = Field(..., description="고유한 이메일 주소", example="newuser@example.com")
    name: str = Field(..., min_length=1, max_length=100, description="사용자 이름", example="홍길동")
    password: str = Field(..., min_length=8, max_length=100, description="비밀번호 (최소 8자)", example="SecurePassword123!")

    class Config:
        json_schema_extra = {
            "example": {
                "email": "newuser@example.com",
                "name": "홍길동",
                "password": "SecurePassword123!"
            }
        }


class RefreshTokenRequest(BaseModel):
    """Refresh token request schema."""
    
    refresh_token: str = Field(..., min_length=1, description="유효한 리프레시 토큰", example="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...")

    class Config:
        json_schema_extra = {
            "example": {
                "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
            }
        }


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