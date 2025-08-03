"""
Authentication service for user registration, login, and token management.
"""
from typing import Optional
from datetime import datetime, timedelta

from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    verify_token,
    validate_password_strength,
)
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.repositories.user_settings_repository import UserSettingsRepository
from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest
from app.schemas.user import UserProfile


class AuthService:
    """Service for authentication operations."""
    
    def __init__(
        self,
        user_repository: UserRepository,
        user_settings_repository: UserSettingsRepository,
        redis_client,
    ):
        self.user_repository = user_repository
        self.user_settings_repository = user_settings_repository
        self.redis_client = redis_client
    
    async def register(self, register_data: RegisterRequest) -> AuthResponse:
        """Register a new user."""
        # Check if user already exists
        existing_user = await self.user_repository.find_by_email(register_data.email)
        if existing_user:
            raise ValueError("User with this email already exists")
        
        # Validate password strength
        is_valid, errors = validate_password_strength(register_data.password)
        if not is_valid:
            raise ValueError(f"Password validation failed: {', '.join(errors)}")
        
        # Create user
        user = User(
            id=User.generate_id(),
            email=register_data.email,
            name=register_data.name,
            password_hash=get_password_hash(register_data.password),
            email_verified=False,
            is_active=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        
        await self.user_repository.save(user)
        
        # Create default user settings
        await self.user_settings_repository.create_default_settings(user.id)
        
        # Generate tokens
        return await self._generate_tokens(user)
    
    async def login(
        self, login_data: LoginRequest, remember_me: bool = False
    ) -> AuthResponse:
        """Authenticate user and generate tokens."""
        user = await self.validate_user(login_data.email, login_data.password)
        if not user:
            raise ValueError("Invalid email or password")
        
        return await self._generate_tokens(user, remember_me)
    
    async def validate_user(self, email: str, password: str) -> Optional[User]:
        """Validate user credentials."""
        user = await self.user_repository.find_by_email(email)
        if not user:
            return None
        
        if not user.is_active:
            return None
        
        if not verify_password(password, user.password_hash):
            return None
        
        return user
    
    async def refresh_token(self, refresh_token: str) -> AuthResponse:
        """Refresh access token using refresh token."""
        # Verify refresh token
        user_id = verify_token(refresh_token, "refresh")
        if not user_id:
            raise ValueError("Invalid refresh token")
        
        # Check if refresh token is revoked
        is_revoked = await self._is_token_revoked(user_id, refresh_token)
        if is_revoked:
            raise ValueError("Refresh token has been revoked")
        
        # Get user
        user = await self.user_repository.find_by_id(user_id)
        if not user or not user.is_active:
            raise ValueError("User not found or inactive")
        
        # Generate new tokens
        return await self._generate_tokens(user)
    
    async def logout(self, user_id: str, access_token: str) -> None:
        """Logout user by revoking tokens."""
        # Revoke refresh token
        await self._revoke_refresh_token(user_id)
        
        # Blacklist access token
        await self._blacklist_token(access_token)
    
    async def validate_token(self, token: str) -> bool:
        """Validate access token."""
        try:
            # Check if token is blacklisted
            is_blacklisted = await self._is_token_blacklisted(token)
            if is_blacklisted:
                return False
            
            # Verify token
            user_id = verify_token(token, "access")
            return user_id is not None
        except Exception:
            return False
    
    async def _generate_tokens(
        self, user: User, remember_me: bool = False
    ) -> AuthResponse:
        """Generate authentication tokens and response."""
        # Create tokens
        access_token = create_access_token(user.id)
        
        # Extend refresh token expiry if remember_me is True
        refresh_expiry = (
            timedelta(days=90) if remember_me else timedelta(days=30)
        )
        refresh_token = create_refresh_token(user.id, refresh_expiry)
        
        # Save refresh token
        await self._save_refresh_token(user.id, refresh_token)
        
        # Get user settings
        user_settings = await self.user_settings_repository.find_by_user_id(user.id)
        
        # Create user profile
        user_profile = UserProfile(
            id=user.id,
            email=user.email,
            name=user.name,
            email_verified=user.email_verified,
            created_at=user.created_at,
        )
        
        return AuthResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=user_profile,
            user_settings=user_settings,
        )
    
    async def _save_refresh_token(self, user_id: str, token: str) -> None:
        """Save refresh token to Redis."""
        key = f"refresh_token:{user_id}"
        await self.redis_client.set(key, token, ex=90 * 24 * 60 * 60)  # 90 days
    
    async def _revoke_refresh_token(self, user_id: str) -> None:
        """Revoke user's refresh token."""
        key = f"refresh_token:{user_id}"
        await self.redis_client.delete(key)
    
    async def _is_token_revoked(self, user_id: str, token: str) -> bool:
        """Check if refresh token is revoked."""
        key = f"refresh_token:{user_id}"
        stored_token = await self.redis_client.get(key)
        return stored_token != token
    
    async def _blacklist_token(self, token: str) -> None:
        """Add token to blacklist."""
        key = f"blacklist:{token}"
        # Token will expire naturally, so we set TTL to match access token expiry
        await self.redis_client.set(key, "1", ex=30 * 60)  # 30 minutes
    
    async def _is_token_blacklisted(self, token: str) -> bool:
        """Check if token is blacklisted."""
        key = f"blacklist:{token}"
        return await self.redis_client.exists(key)