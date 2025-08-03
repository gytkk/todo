"""
Test auth API endpoints.
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, MagicMock
from datetime import datetime

from app.main import app
from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest
from app.schemas.user import UserProfile
from app.models.user_settings import UserSettings, ThemeType


class TestAuthAPI:
    """Test authentication API endpoints."""
    
    @pytest.fixture
    def client(self):
        """Test client."""
        return TestClient(app)
    
    @pytest.fixture
    def mock_auth_response(self):
        """Mock auth response."""
        return AuthResponse(
            access_token="test_access_token",
            refresh_token="test_refresh_token",
            user=UserProfile(
                id="test-user-id",
                email="test@example.com",
                name="Test User",
                email_verified=False,
                created_at=datetime.utcnow(),
            ),
            user_settings=UserSettings(
                user_id="test-user-id",
                theme=ThemeType.LIGHT,
                language="ko",
                theme_color="#3B82F6",
            ),
        )
    
    def test_register_success(self, client, mock_auth_response, monkeypatch):
        """Test successful user registration."""
        from app.main import app
        from app.core.dependencies import get_auth_service
        
        # Mock auth service
        mock_auth_service = AsyncMock()
        mock_auth_service.register.return_value = mock_auth_response
        
        # Override the dependency
        app.dependency_overrides[get_auth_service] = lambda: mock_auth_service
        
        # Test data
        register_data = {
            "email": "test@example.com",
            "name": "Test User",
            "password": "StrongPass123!",
        }
        
        # Make request
        response = client.post("/auth/register", json=register_data)
        
        # Assert
        assert response.status_code == 201
        data = response.json()
        assert data["access_token"] == "test_access_token"
        assert data["refresh_token"] == "test_refresh_token"
        assert data["user"]["email"] == "test@example.com"
        
        # Verify service was called
        mock_auth_service.register.assert_called_once()
        call_args = mock_auth_service.register.call_args[0][0]
        assert call_args.email == "test@example.com"
        assert call_args.name == "Test User"
        assert call_args.password == "StrongPass123!"
        
        # Cleanup
        app.dependency_overrides.clear()
    
    def test_register_validation_error(self, client):
        """Test registration with validation errors."""
        register_data = {
            "email": "invalid-email",
            "name": "",
            "password": "weak",
        }
        
        response = client.post("/auth/register", json=register_data)
        
        assert response.status_code == 422
        data = response.json()
        assert "detail" in data
    
    def test_register_user_exists_error(self, client, monkeypatch):
        """Test registration when user already exists."""
        from app.main import app
        from app.core.dependencies import get_auth_service
        
        mock_auth_service = AsyncMock()
        mock_auth_service.register.side_effect = ValueError("User with this email already exists")
        
        # Override the dependency
        app.dependency_overrides[get_auth_service] = lambda: mock_auth_service
        
        register_data = {
            "email": "existing@example.com",
            "name": "Test User",
            "password": "StrongPass123!",
        }
        
        response = client.post("/auth/register", json=register_data)
        
        assert response.status_code == 400
        data = response.json()
        assert "User with this email already exists" in data["detail"]
        
        # Cleanup
        app.dependency_overrides.clear()
    
    def test_login_success(self, client, mock_auth_response, monkeypatch):
        """Test successful user login."""
        from app.main import app
        from app.core.dependencies import get_auth_service
        
        mock_auth_service = AsyncMock()
        mock_auth_service.login.return_value = mock_auth_response
        
        # Override the dependency
        app.dependency_overrides[get_auth_service] = lambda: mock_auth_service
        
        login_data = {
            "email": "test@example.com",
            "password": "correctpassword",
            "remember_me": False,
        }
        
        response = client.post("/auth/login", json=login_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["access_token"] == "test_access_token"
        assert data["user"]["email"] == "test@example.com"
        
        mock_auth_service.login.assert_called_once()
        
        # Cleanup
        app.dependency_overrides.clear()
    
    def test_login_invalid_credentials(self, client, monkeypatch):
        """Test login with invalid credentials."""
        from app.main import app
        from app.core.dependencies import get_auth_service
        
        mock_auth_service = AsyncMock()
        mock_auth_service.login.side_effect = ValueError("Invalid email or password")
        
        # Override the dependency
        app.dependency_overrides[get_auth_service] = lambda: mock_auth_service
        
        login_data = {
            "email": "test@example.com",
            "password": "wrongpassword",
        }
        
        response = client.post("/auth/login", json=login_data)
        
        assert response.status_code == 401
        data = response.json()
        assert "Invalid email or password" in data["detail"]
        
        # Cleanup
        app.dependency_overrides.clear()
    
    def test_refresh_token_success(self, client, mock_auth_response, monkeypatch):
        """Test successful token refresh."""
        from app.main import app
        from app.core.dependencies import get_auth_service
        
        mock_auth_service = AsyncMock()
        mock_auth_service.refresh_token.return_value = mock_auth_response
        
        # Override the dependency
        app.dependency_overrides[get_auth_service] = lambda: mock_auth_service
        
        refresh_data = {"refresh_token": "valid_refresh_token"}
        
        response = client.post("/auth/refresh", json=refresh_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["access_token"] == "test_access_token"
        
        mock_auth_service.refresh_token.assert_called_once_with("valid_refresh_token")
        
        # Cleanup
        app.dependency_overrides.clear()
    
    def test_refresh_token_invalid(self, client, monkeypatch):
        """Test refresh with invalid token."""
        from app.main import app
        from app.core.dependencies import get_auth_service
        
        mock_auth_service = AsyncMock()
        mock_auth_service.refresh_token.side_effect = ValueError("Invalid refresh token")
        
        # Override the dependency
        app.dependency_overrides[get_auth_service] = lambda: mock_auth_service
        
        refresh_data = {"refresh_token": "invalid_token"}
        
        response = client.post("/auth/refresh", json=refresh_data)
        
        assert response.status_code == 401
        data = response.json()
        assert "Invalid refresh token" in data["detail"]
        
        # Cleanup
        app.dependency_overrides.clear()
    
    def test_logout_success(self, client, monkeypatch):
        """Test successful logout."""
        from app.main import app
        from app.core.dependencies import get_auth_service, get_current_user_id
        
        mock_auth_service = AsyncMock()
        mock_auth_service.logout.return_value = None
        
        # Override dependencies
        app.dependency_overrides[get_auth_service] = lambda: mock_auth_service
        app.dependency_overrides[get_current_user_id] = lambda: "test-user-id"
        
        headers = {"Authorization": "Bearer test_access_token"}
        response = client.post("/auth/logout", headers=headers)
        
        assert response.status_code == 204
        
        mock_auth_service.logout.assert_called_once_with(
            "test-user-id", "test_access_token"
        )
        
        # Cleanup
        app.dependency_overrides.clear()