"""
Test user settings API endpoints.
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock
from datetime import datetime
from typing import List

from app.main import app
from app.models.user_settings import UserSettings, ThemeType
from app.schemas.user_settings import UserSettingsResponse, ImportDataResponse
from app.models.category import CategoryResponse


class TestUserSettingsAPI:
    """Test user settings API endpoints."""
    
    @pytest.fixture
    def client(self):
        """Test client."""
        return TestClient(app)
    
    @pytest.fixture
    def mock_user_settings(self):
        """Mock user settings."""
        return UserSettings(
            user_id="test-user-id",
            theme=ThemeType.LIGHT,
            language="ko",
            theme_color="#3B82F6",
        )
    
    @pytest.fixture
    def mock_category_response(self):
        """Mock category response."""
        return CategoryResponse(
            id="test-category-id",
            name="Test Category",
            color="#FF0000",
            icon="test-icon",
            order=1,
            user_id="test-user-id",
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
    
    def test_get_user_settings_success(self, client, mock_user_settings):
        """Test successful get user settings."""
        from app.core.dependencies import get_user_settings_service, get_current_user_id
        
        # Mock user settings service
        mock_service = AsyncMock()
        mock_service.get_settings.return_value = mock_user_settings
        
        # Override dependencies
        app.dependency_overrides[get_user_settings_service] = lambda: mock_service
        app.dependency_overrides[get_current_user_id] = lambda: "test-user-id"
        
        headers = {"Authorization": "Bearer test_access_token"}
        response = client.get("/user-settings", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["user_id"] == "test-user-id"
        assert data["theme"] == "light"
        assert data["language"] == "ko"
        
        mock_service.get_settings.assert_called_once_with("test-user-id")
        
        # Cleanup
        app.dependency_overrides.clear()
    
    def test_update_user_settings_success(self, client, mock_user_settings):
        """Test successful update user settings."""
        from app.core.dependencies import get_user_settings_service, get_current_user_id
        
        # Mock user settings service
        mock_service = AsyncMock()
        mock_service.update_settings.return_value = mock_user_settings
        
        # Override dependencies
        app.dependency_overrides[get_user_settings_service] = lambda: mock_service
        app.dependency_overrides[get_current_user_id] = lambda: "test-user-id"
        
        update_data = {
            "theme": "dark",
            "language": "en",
            "theme_color": "#FF0000",
        }
        headers = {"Authorization": "Bearer test_access_token"}
        response = client.put("/user-settings", json=update_data, headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["user_id"] == "test-user-id"
        
        mock_service.update_settings.assert_called_once()
        
        # Cleanup
        app.dependency_overrides.clear()
    
    def test_get_categories_success(self, client, mock_category_response):
        """Test successful get categories."""
        from app.core.dependencies import get_user_settings_service, get_current_user_id
        
        # Mock user settings service
        mock_service = AsyncMock()
        mock_service.get_categories.return_value = [mock_category_response]
        
        # Override dependencies
        app.dependency_overrides[get_user_settings_service] = lambda: mock_service
        app.dependency_overrides[get_current_user_id] = lambda: "test-user-id"
        
        headers = {"Authorization": "Bearer test_access_token"}
        response = client.get("/user-settings/categories", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["categories"]
        assert len(data["categories"]) == 1
        assert data["categories"][0]["id"] == "test-category-id"
        
        mock_service.get_categories.assert_called_once_with("test-user-id")
        
        # Cleanup
        app.dependency_overrides.clear()
    
    def test_create_category_success(self, client, mock_category_response):
        """Test successful create category."""
        from app.core.dependencies import get_user_settings_service, get_current_user_id
        
        # Mock user settings service
        mock_service = AsyncMock()
        mock_service.create_category.return_value = mock_category_response
        
        # Override dependencies
        app.dependency_overrides[get_user_settings_service] = lambda: mock_service
        app.dependency_overrides[get_current_user_id] = lambda: "test-user-id"
        
        category_data = {
            "name": "New Category",
            "color": "#00FF00",
            "icon": "new-icon",
        }
        headers = {"Authorization": "Bearer test_access_token"}
        response = client.post("/user-settings/categories", json=category_data, headers=headers)
        
        assert response.status_code == 201
        data = response.json()
        assert data["category"]["id"] == "test-category-id"
        
        mock_service.create_category.assert_called_once()
        
        # Cleanup
        app.dependency_overrides.clear()
    
    def test_update_category_success(self, client, mock_category_response):
        """Test successful update category."""
        from app.core.dependencies import get_user_settings_service, get_current_user_id
        
        # Mock user settings service
        mock_service = AsyncMock()
        mock_service.update_category.return_value = mock_category_response
        
        # Override dependencies
        app.dependency_overrides[get_user_settings_service] = lambda: mock_service
        app.dependency_overrides[get_current_user_id] = lambda: "test-user-id"
        
        update_data = {
            "name": "Updated Category",
            "color": "#0000FF",
        }
        headers = {"Authorization": "Bearer test_access_token"}
        response = client.put("/user-settings/categories/test-category-id", json=update_data, headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["category"]["id"] == "test-category-id"
        
        mock_service.update_category.assert_called_once()
        
        # Cleanup
        app.dependency_overrides.clear()
    
    def test_delete_category_success(self, client):
        """Test successful delete category."""
        from app.core.dependencies import get_user_settings_service, get_current_user_id
        
        # Mock user settings service
        mock_service = AsyncMock()
        mock_service.delete_category.return_value = None
        
        # Override dependencies
        app.dependency_overrides[get_user_settings_service] = lambda: mock_service
        app.dependency_overrides[get_current_user_id] = lambda: "test-user-id"
        
        headers = {"Authorization": "Bearer test_access_token"}
        response = client.delete("/user-settings/categories/test-category-id", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["deleted_id"] == "test-category-id"
        
        mock_service.delete_category.assert_called_once_with("test-user-id", "test-category-id")
        
        # Cleanup
        app.dependency_overrides.clear()
    
    def test_get_available_colors_success(self, client):
        """Test successful get available colors."""
        from app.core.dependencies import get_user_settings_service, get_current_user_id
        
        # Mock user settings service
        mock_service = AsyncMock()
        available_colors = ["#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF"]
        mock_service.get_available_colors.return_value = available_colors
        
        # Override dependencies
        app.dependency_overrides[get_user_settings_service] = lambda: mock_service
        app.dependency_overrides[get_current_user_id] = lambda: "test-user-id"
        
        headers = {"Authorization": "Bearer test_access_token"}
        response = client.get("/user-settings/categories/available-colors", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["colors"] == available_colors
        
        mock_service.get_available_colors.assert_called_once()
        
        # Cleanup
        app.dependency_overrides.clear()
    
    def test_reorder_categories_success(self, client, mock_category_response):
        """Test successful reorder categories."""
        from app.core.dependencies import get_user_settings_service, get_current_user_id
        
        # Mock user settings service
        mock_service = AsyncMock()
        mock_service.reorder_categories.return_value = [mock_category_response]
        
        # Override dependencies
        app.dependency_overrides[get_user_settings_service] = lambda: mock_service
        app.dependency_overrides[get_current_user_id] = lambda: "test-user-id"
        
        reorder_data = {
            "category_ids": ["test-category-id", "another-category-id"]
        }
        headers = {"Authorization": "Bearer test_access_token"}
        response = client.put("/user-settings/categories/reorder", json=reorder_data, headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["categories"]
        assert data["message"] == "Categories reordered successfully"
        
        mock_service.reorder_categories.assert_called_once()
        
        # Cleanup
        app.dependency_overrides.clear()
    
    def test_reset_settings_success(self, client, mock_user_settings):
        """Test successful reset settings."""
        from app.core.dependencies import get_user_settings_service, get_current_user_id
        
        # Mock user settings service
        mock_service = AsyncMock()
        mock_service.reset_settings.return_value = mock_user_settings
        
        # Override dependencies
        app.dependency_overrides[get_user_settings_service] = lambda: mock_service
        app.dependency_overrides[get_current_user_id] = lambda: "test-user-id"
        
        headers = {"Authorization": "Bearer test_access_token"}
        response = client.post("/user-settings/reset", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["user_id"] == "test-user-id"
        assert "reset" in response.json()
        
        mock_service.reset_settings.assert_called_once_with("test-user-id")
        
        # Cleanup
        app.dependency_overrides.clear()
    
    def test_export_data_success(self, client):
        """Test successful export data."""
        from app.core.dependencies import get_user_settings_service, get_current_user_id
        
        # Mock user settings service
        mock_service = AsyncMock()
        export_data = {
            "settings": {"theme": "light", "language": "ko"},
            "categories": [{"name": "Test", "color": "#FF0000"}],
            "todos": []
        }
        mock_service.export_data.return_value = export_data
        
        # Override dependencies
        app.dependency_overrides[get_user_settings_service] = lambda: mock_service
        app.dependency_overrides[get_current_user_id] = lambda: "test-user-id"
        
        headers = {"Authorization": "Bearer test_access_token"}
        response = client.get("/user-settings/export", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "settings" in data
        assert "categories" in data
        
        mock_service.export_data.assert_called_once_with("test-user-id")
        
        # Cleanup
        app.dependency_overrides.clear()
    
    def test_import_data_success(self, client, mock_user_settings):
        """Test successful import data."""
        from app.core.dependencies import get_user_settings_service, get_current_user_id
        
        # Mock user settings service
        mock_service = AsyncMock()
        mock_service.import_data.return_value = mock_user_settings
        
        # Override dependencies
        app.dependency_overrides[get_user_settings_service] = lambda: mock_service
        app.dependency_overrides[get_current_user_id] = lambda: "test-user-id"
        
        import_data = {
            "settings": {"theme": "dark", "language": "en"},
            "categories": [{"name": "Imported", "color": "#00FF00"}],
            "todos": []
        }
        headers = {"Authorization": "Bearer test_access_token"}
        response = client.post("/user-settings/import", json=import_data, headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["settings"]["user_id"] == "test-user-id"
        assert data["message"] == "Data imported successfully"
        
        mock_service.import_data.assert_called_once()
        
        # Cleanup
        app.dependency_overrides.clear()
    
    def test_get_category_filter_success(self, client):
        """Test successful get category filter."""
        from app.core.dependencies import get_user_settings_service, get_current_user_id
        
        # Mock user settings service
        mock_service = AsyncMock()
        filter_data = {"enabled_categories": ["cat1", "cat2"], "show_completed": True}
        mock_service.get_category_filter.return_value = filter_data
        
        # Override dependencies
        app.dependency_overrides[get_user_settings_service] = lambda: mock_service
        app.dependency_overrides[get_current_user_id] = lambda: "test-user-id"
        
        headers = {"Authorization": "Bearer test_access_token"}
        response = client.get("/user-settings/category-filter", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "enabled_categories" in data
        assert data["show_completed"] == True
        
        mock_service.get_category_filter.assert_called_once_with("test-user-id")
        
        # Cleanup
        app.dependency_overrides.clear()
    
    def test_update_category_filter_success(self, client, mock_category_response):
        """Test successful update category filter."""
        from app.core.dependencies import get_user_settings_service, get_current_user_id
        
        # Mock user settings service
        mock_service = AsyncMock()
        mock_service.update_category_filter.return_value = mock_category_response
        
        # Override dependencies
        app.dependency_overrides[get_user_settings_service] = lambda: mock_service
        app.dependency_overrides[get_current_user_id] = lambda: "test-user-id"
        
        filter_data = {
            "enabled": True,
            "show_completed": False,
        }
        headers = {"Authorization": "Bearer test_access_token"}
        response = client.put("/user-settings/categories/test-category-id/filter", json=filter_data, headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["category"]["id"] == "test-category-id"
        
        mock_service.update_category_filter.assert_called_once()
        
        # Cleanup
        app.dependency_overrides.clear()