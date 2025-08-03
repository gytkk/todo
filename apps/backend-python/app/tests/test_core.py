"""
Test core functionality (config, security, dependencies).
"""
import pytest
from datetime import datetime, timedelta
from unittest.mock import patch

from app.core.config import Settings
from app.core.security import (
    create_access_token, create_refresh_token, verify_token,
    verify_password, get_password_hash, validate_password_strength
)


class TestConfig:
    """Test configuration settings."""
    
    def test_default_settings(self):
        """Test default configuration values."""
        settings = Settings()
        
        assert settings.app_name == "Calendar Todo API"
        assert settings.app_version == "1.0.0"
        assert settings.redis_host == "localhost"
        assert settings.redis_port == 6379
        assert settings.jwt_algorithm == "HS256"
        assert settings.jwt_access_token_expire_minutes == 30
        assert settings.jwt_refresh_token_expire_days == 30
    
    def test_redis_url_with_password(self):
        """Test Redis URL generation with password."""
        settings = Settings(
            redis_host="localhost",
            redis_port=6379,
            redis_password="test123",
            redis_db=1
        )
        
        expected_url = "redis://:test123@localhost:6379/1"
        assert settings.redis_url == expected_url
    
    def test_redis_url_without_password(self):
        """Test Redis URL generation without password."""
        settings = Settings(
            redis_host="localhost",
            redis_port=6379,
            redis_password=None,
            redis_db=0
        )
        
        expected_url = "redis://localhost:6379/0"
        assert settings.redis_url == expected_url


class TestSecurity:
    """Test security utilities."""
    
    def test_password_hashing(self):
        """Test password hashing and verification."""
        password = "test_password_123"
        
        # Hash password
        hashed = get_password_hash(password)
        assert hashed != password
        assert len(hashed) > 0
        
        # Verify correct password
        assert verify_password(password, hashed)
        
        # Verify incorrect password
        assert not verify_password("wrong_password", hashed)
    
    def test_access_token_creation_and_verification(self):
        """Test JWT access token creation and verification."""
        user_id = "user_123"
        
        # Create token
        token = create_access_token(user_id)
        assert isinstance(token, str)
        assert len(token) > 0
        
        # Verify token
        verified_user_id = verify_token(token, "access")
        assert verified_user_id == user_id
    
    def test_refresh_token_creation_and_verification(self):
        """Test JWT refresh token creation and verification."""
        user_id = "user_123"
        
        # Create token
        token = create_refresh_token(user_id)
        assert isinstance(token, str)
        assert len(token) > 0
        
        # Verify token
        verified_user_id = verify_token(token, "refresh")
        assert verified_user_id == user_id
    
    def test_token_with_custom_expiry(self):
        """Test token creation with custom expiry."""
        user_id = "user_123"
        custom_expiry = timedelta(minutes=5)
        
        token = create_access_token(user_id, custom_expiry)
        verified_user_id = verify_token(token, "access")
        
        assert verified_user_id == user_id
    
    def test_invalid_token_verification(self):
        """Test verification of invalid tokens."""
        # Invalid token string
        assert verify_token("invalid_token", "access") is None
        
        # Wrong token type
        refresh_token = create_refresh_token("user_123")
        assert verify_token(refresh_token, "access") is None
        
        access_token = create_access_token("user_123")
        assert verify_token(access_token, "refresh") is None
    
    def test_password_strength_validation(self):
        """Test password strength validation."""
        # Valid strong password
        is_valid, errors = validate_password_strength("StrongPass123!")
        assert is_valid
        assert len(errors) == 0
        
        # Too short
        is_valid, errors = validate_password_strength("Short1!")
        assert not is_valid
        assert "at least 8 characters" in " ".join(errors)
        
        # No uppercase
        is_valid, errors = validate_password_strength("weakpass123!")
        assert not is_valid
        assert "uppercase letter" in " ".join(errors)
        
        # No lowercase
        is_valid, errors = validate_password_strength("WEAKPASS123!")
        assert not is_valid
        assert "lowercase letter" in " ".join(errors)
        
        # No digit
        is_valid, errors = validate_password_strength("WeakPass!")
        assert not is_valid
        assert "digit" in " ".join(errors)
        
        # No special character
        is_valid, errors = validate_password_strength("WeakPass123")
        assert not is_valid
        assert "special character" in " ".join(errors)
    
    @patch('app.core.security.datetime')
    def test_expired_token(self, mock_datetime):
        """Test that expired tokens are rejected."""
        user_id = "user_123"
        
        # Create token that's already expired
        past_time = datetime.utcnow() - timedelta(hours=1)
        mock_datetime.utcnow.return_value = past_time
        
        token = create_access_token(user_id, timedelta(minutes=-30))
        
        # Reset mock to current time
        mock_datetime.utcnow.return_value = datetime.utcnow()
        
        # Token should be invalid due to expiration
        verified_user_id = verify_token(token, "access")
        assert verified_user_id is None