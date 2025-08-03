"""
Test users API endpoints.
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock
from datetime import datetime

from app.main import app
from app.schemas.user import UserProfileResponse, ChangePasswordResponse
from app.schemas.user import UserProfile


class TestUsersAPI:
    """Test users API endpoints."""
    
    @pytest.fixture
    def client(self):
        """Test client."""
        return TestClient(app)
    
    @pytest.fixture
    def mock_user_profile(self):
        """Mock user profile."""
        return UserProfile(
            id="test-user-id",
            email="test@example.com",
            name="Test User",
            email_verified=False,
            created_at=datetime.now(),
        )
    
    @pytest.fixture
    def mock_user_profile_response(self, mock_user_profile):
        """Mock user profile response."""
        return UserProfileResponse(user=mock_user_profile)
    
    def test_get_current_user_success(self, client, mock_user_profile_response):
        """Test successful get current user profile."""
        from app.core.dependencies import get_user_service, get_current_user_id
        
        # Mock user service
        mock_user_service = AsyncMock()
        mock_user_service.get_user_profile.return_value = mock_user_profile_response.user
        
        # Override dependencies
        app.dependency_overrides[get_user_service] = lambda: mock_user_service
        app.dependency_overrides[get_current_user_id] = lambda: "test-user-id"
        
        headers = {"Authorization": "Bearer test_access_token"}
        response = client.get("/users/me", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["id"] == "test-user-id"
        assert data["user"]["email"] == "test@example.com"
        assert data["user"]["name"] == "Test User"
        
        mock_user_service.get_user_profile.assert_called_once_with("test-user-id")
        
        # Cleanup
        app.dependency_overrides.clear()
    
    def test_get_current_user_unauthorized(self, client):
        """Test get current user without authorization."""
        response = client.get("/users/me")
        
        assert response.status_code == 403
    
    def test_update_current_user_success(self, client, mock_user_profile_response):
        """Test successful update current user profile."""
        from app.core.dependencies import get_user_service, get_current_user_id
        
        # Mock user service
        mock_user_service = AsyncMock()
        mock_user_service.update_profile.return_value = mock_user_profile_response.user
        
        # Override dependencies
        app.dependency_overrides[get_user_service] = lambda: mock_user_service
        app.dependency_overrides[get_current_user_id] = lambda: "test-user-id"
        
        update_data = {"name": "Updated Name"}
        headers = {"Authorization": "Bearer test_access_token"}
        response = client.put("/users/me", json=update_data, headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["id"] == "test-user-id"
        
        mock_user_service.update_profile.assert_called_once()
        call_args = mock_user_service.update_profile.call_args[0]
        assert call_args[0] == "test-user-id"
        assert call_args[1].name == "Updated Name"
        
        # Cleanup
        app.dependency_overrides.clear()
    
    def test_update_current_user_validation_error(self, client):
        """Test update current user with validation errors."""
        from app.core.dependencies import get_current_user_id
        
        # Override dependencies
        app.dependency_overrides[get_current_user_id] = lambda: "test-user-id"
        
        update_data = {"name": ""}  # Invalid empty name
        headers = {"Authorization": "Bearer test_access_token"}
        response = client.put("/users/me", json=update_data, headers=headers)
        
        assert response.status_code == 422
        data = response.json()
        assert "detail" in data
        
        # Cleanup
        app.dependency_overrides.clear()
    
    def test_change_password_success(self, client):
        """Test successful password change."""
        from app.core.dependencies import get_user_service, get_current_user_id
        
        # Mock user service
        mock_user_service = AsyncMock()
        mock_user_service.change_password.return_value = ChangePasswordResponse()
        
        # Override dependencies
        app.dependency_overrides[get_user_service] = lambda: mock_user_service
        app.dependency_overrides[get_current_user_id] = lambda: "test-user-id"
        
        password_data = {
            "current_password": "oldpassword",
            "new_password": "newpassword123",
        }
        headers = {"Authorization": "Bearer test_access_token"}
        response = client.put("/users/me/password", json=password_data, headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Password changed successfully"
        
        mock_user_service.change_password.assert_called_once()
        call_args = mock_user_service.change_password.call_args[0]
        assert call_args[0] == "test-user-id"
        assert call_args[1].current_password == "oldpassword"
        assert call_args[1].new_password == "newpassword123"
        
        # Cleanup
        app.dependency_overrides.clear()
    
    def test_change_password_invalid_current(self, client):
        """Test password change with invalid current password."""
        from app.core.dependencies import get_user_service, get_current_user_id
        
        # Mock user service
        mock_user_service = AsyncMock()
        mock_user_service.change_password.side_effect = ValueError("Invalid current password")
        
        # Override dependencies
        app.dependency_overrides[get_user_service] = lambda: mock_user_service
        app.dependency_overrides[get_current_user_id] = lambda: "test-user-id"
        
        password_data = {
            "current_password": "wrongpassword",
            "new_password": "newpassword123",
        }
        headers = {"Authorization": "Bearer test_access_token"}
        response = client.put("/users/me/password", json=password_data, headers=headers)
        
        assert response.status_code == 400
        data = response.json()
        assert "Invalid current password" in data["detail"]
        
        # Cleanup
        app.dependency_overrides.clear()
    
    def test_delete_current_user_success(self, client):
        """Test successful user account deletion."""
        from app.core.dependencies import get_user_service, get_current_user_id
        
        # Mock user service
        mock_user_service = AsyncMock()
        mock_user_service.delete_account.return_value = None
        
        # Override dependencies
        app.dependency_overrides[get_user_service] = lambda: mock_user_service
        app.dependency_overrides[get_current_user_id] = lambda: "test-user-id"
        
        headers = {"Authorization": "Bearer test_access_token"}
        response = client.delete("/users/me", headers=headers)
        
        assert response.status_code == 204
        
        mock_user_service.delete_account.assert_called_once_with("test-user-id")
        
        # Cleanup
        app.dependency_overrides.clear()