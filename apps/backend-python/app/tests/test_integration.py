"""
Integration tests for the FastAPI application.

These tests run against the actual FastAPI application with real Redis connections
to verify the full integration flow from API endpoints to the database.
"""
import pytest
from fastapi.testclient import TestClient
from datetime import datetime
from typing import Dict, Any

from app.main import app


@pytest.mark.integration
class TestIntegrationSetup:
    """Test integration setup and teardown."""
    
    @pytest.fixture
    def client(self):
        """Test client for integration tests."""
        return TestClient(app)
    
    @pytest.fixture(autouse=True)
    def setup_test_env(self, monkeypatch):
        """Setup test environment variables."""
        # Use test Redis DB 
        monkeypatch.setenv("REDIS_DB", "15")
        # Ensure clean database for each test
        import redis
        try:
            r = redis.Redis(host='localhost', port=6379, password='todoapp123', db=15)
            r.flushdb()
        except Exception:
            pytest.skip("Redis not available for integration tests")


@pytest.mark.integration
class TestAuthIntegration(TestIntegrationSetup):
    """Integration tests for authentication flow."""
    
    def test_user_registration_flow(self, client):
        """Test complete user registration flow."""
        # Register new user with unique email
        import uuid
        unique_id = str(uuid.uuid4())[:8]
        register_data = {
            "email": f"integration-{unique_id}@test.com",
            "name": "Integration Test User", 
            "password": "TestPassword123!"
        }
        
        response = client.post("/auth/register", json=register_data)
        
        # Debug: print response if not 201
        if response.status_code != 201:
            print(f"Response status: {response.status_code}")
            print(f"Response body: {response.json()}")
        
        assert response.status_code == 201
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["user"]["email"] == f"integration-{unique_id}@test.com"
        assert data["user"]["name"] == "Integration Test User"
        assert "user_settings" in data
        
        # Verify user can be retrieved
        headers = {"Authorization": f"Bearer {data['access_token']}"}
        profile_response = client.get("/users/me", headers=headers)
        assert profile_response.status_code == 200
        profile_data = profile_response.json()
        assert profile_data["email"] == f"integration-{unique_id}@test.com"
    
    def test_login_flow(self, client):
        """Test complete login flow."""
        # First register a user
        register_data = {
            "email": "login@test.com",
            "name": "Login Test User",
            "password": "TestPassword123!"
        }
        register_response = client.post("/auth/register", json=register_data)
        assert register_response.status_code == 201
        
        # Now test login
        login_data = {
            "email": "login@test.com",
            "password": "TestPassword123!",
            "remember_me": False
        }
        
        response = client.post("/auth/login", json=login_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["user"]["email"] == "login@test.com"
    
    def test_token_refresh_flow(self, client):
        """Test token refresh flow."""
        # Register and get tokens
        register_data = {
            "email": "refresh@test.com",
            "name": "Refresh Test User",
            "password": "TestPassword123!"
        }
        register_response = client.post("/auth/register", json=register_data)
        register_data_response = register_response.json()
        
        # Test token refresh
        refresh_data = {
            "refresh_token": register_data_response["refresh_token"]
        }
        
        response = client.post("/auth/refresh", json=refresh_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["user"]["email"] == "refresh@test.com"
    
    def test_logout_flow(self, client):
        """Test logout flow."""
        # Register and get tokens
        register_data = {
            "email": "logout@test.com", 
            "name": "Logout Test User",
            "password": "TestPassword123!"
        }
        register_response = client.post("/auth/register", json=register_data)
        auth_data = register_response.json()
        
        # Test logout
        headers = {"Authorization": f"Bearer {auth_data['access_token']}"}
        response = client.post("/auth/logout", headers=headers)
        
        assert response.status_code == 204
        
        # Verify token is invalidated (should fail to access protected endpoint)
        profile_response = client.get("/users/me", headers=headers)
        assert profile_response.status_code == 401


@pytest.mark.integration
class TestTodoIntegration(TestIntegrationSetup):
    """Integration tests for Todo operations."""
    
    @pytest.fixture
    def authenticated_user(self, client):
        """Create authenticated user for todo tests."""
        register_data = {
            "email": "todo@test.com",
            "name": "Todo Test User", 
            "password": "TestPassword123!"
        }
        response = client.post("/auth/register", json=register_data)
        auth_data = response.json()
        
        return {
            "headers": {"Authorization": f"Bearer {auth_data['access_token']}"},
            "user_id": auth_data["user"]["id"],
            "auth_data": auth_data
        }
    
    def test_todo_crud_flow(self, client, authenticated_user):
        """Test complete Todo CRUD flow."""
        headers = authenticated_user["headers"]
        
        # Create todo
        todo_data = {
            "title": "Integration Test Todo",
            "description": "Test description",
            "due_date": "2024-12-31",
            "priority": "MEDIUM",
            "todo_type": "TASK",
            "category_id": None
        }
        
        create_response = client.post("/todos", json=todo_data, headers=headers)
        assert create_response.status_code == 201
        created_todo = create_response.json()
        todo_id = created_todo["id"]
        
        assert created_todo["title"] == "Integration Test Todo"
        assert created_todo["is_completed"] is False
        
        # Get todos
        list_response = client.get("/todos", headers=headers)
        assert list_response.status_code == 200
        todos = list_response.json()
        assert len(todos) == 1
        assert todos[0]["id"] == todo_id
        
        # Get specific todo
        get_response = client.get(f"/todos/{todo_id}", headers=headers)
        assert get_response.status_code == 200
        retrieved_todo = get_response.json()
        assert retrieved_todo["title"] == "Integration Test Todo"
        
        # Update todo
        update_data = {
            "title": "Updated Integration Test Todo",
            "description": "Updated description",
            "priority": "HIGH"
        }
        update_response = client.put(f"/todos/{todo_id}", json=update_data, headers=headers)
        assert update_response.status_code == 200
        updated_todo = update_response.json()
        assert updated_todo["title"] == "Updated Integration Test Todo"
        assert updated_todo["priority"] == "HIGH"
        
        # Toggle completion
        toggle_response = client.patch(f"/todos/{todo_id}/toggle", headers=headers)
        assert toggle_response.status_code == 200
        toggled_todo = toggle_response.json()
        assert toggled_todo["is_completed"] is True
        
        # Delete todo
        delete_response = client.delete(f"/todos/{todo_id}", headers=headers)
        assert delete_response.status_code == 204
        
        # Verify deletion
        final_list_response = client.get("/todos", headers=headers)
        final_todos = final_list_response.json()
        assert len(final_todos) == 0
    
    def test_todo_stats_flow(self, client, authenticated_user):
        """Test todo statistics flow."""
        headers = authenticated_user["headers"]
        
        # Create multiple todos
        todos_data = [
            {
                "title": "Todo 1",
                "priority": "HIGH",
                "todo_type": "TASK",
                "is_completed": False
            },
            {
                "title": "Todo 2", 
                "priority": "MEDIUM",
                "todo_type": "EVENT",
                "is_completed": True
            },
            {
                "title": "Todo 3",
                "priority": "LOW",
                "todo_type": "TASK", 
                "is_completed": False
            }
        ]
        
        for todo_data in todos_data:
            response = client.post("/todos", json=todo_data, headers=headers)
            assert response.status_code == 201
        
        # Get stats
        stats_response = client.get("/todos/stats", headers=headers)
        assert stats_response.status_code == 200
        stats = stats_response.json()
        
        assert stats["total"] == 3
        assert stats["completed"] == 1
        assert stats["pending"] == 2
        assert stats["completion_rate"] == pytest.approx(33.33, rel=1e-2)


@pytest.mark.integration
class TestUserSettingsIntegration(TestIntegrationSetup):
    """Integration tests for UserSettings operations."""
    
    @pytest.fixture
    def authenticated_user(self, client):
        """Create authenticated user for settings tests."""
        register_data = {
            "email": "settings@test.com",
            "name": "Settings Test User",
            "password": "TestPassword123!"
        }
        response = client.post("/auth/register", json=register_data)
        auth_data = response.json()
        
        return {
            "headers": {"Authorization": f"Bearer {auth_data['access_token']}"},
            "user_id": auth_data["user"]["id"],
            "auth_data": auth_data
        }
    
    def test_user_settings_flow(self, client, authenticated_user):
        """Test user settings management flow."""
        headers = authenticated_user["headers"]
        
        # Get initial settings
        get_response = client.get("/user-settings", headers=headers)
        assert get_response.status_code == 200
        settings = get_response.json()
        
        # Update settings
        update_data = {
            "theme": "dark",
            "language": "en",
            "theme_color": "#FF5722"
        }
        update_response = client.put("/user-settings", json=update_data, headers=headers)
        assert update_response.status_code == 200
        updated_settings = update_response.json()
        
        assert updated_settings["theme"] == "dark"
        assert updated_settings["language"] == "en"
        assert updated_settings["theme_color"] == "#FF5722"
    
    def test_category_management_flow(self, client, authenticated_user):
        """Test category management flow."""
        headers = authenticated_user["headers"]
        
        # Create category
        category_data = {
            "name": "Integration Test Category",
            "color": "#FF5722",
            "icon": "work"
        }
        create_response = client.post("/user-settings/categories", json=category_data, headers=headers)
        assert create_response.status_code == 201
        created_category = create_response.json()["category"]
        category_id = created_category["id"]
        
        # Get categories
        list_response = client.get("/user-settings/categories", headers=headers)
        assert list_response.status_code == 200
        categories = list_response.json()["categories"]
        assert len(categories) >= 1
        
        # Update category
        update_data = {
            "name": "Updated Integration Category",
            "color": "#2196F3"
        }
        update_response = client.put(f"/user-settings/categories/{category_id}", json=update_data, headers=headers)
        assert update_response.status_code == 200
        updated_category = update_response.json()["category"]
        assert updated_category["name"] == "Updated Integration Category"
        assert updated_category["color"] == "#2196F3"
        
        # Delete category
        delete_response = client.delete(f"/user-settings/categories/{category_id}", headers=headers)
        assert delete_response.status_code == 200


@pytest.mark.integration
class TestFullScenarioIntegration(TestIntegrationSetup):
    """Integration tests for complete user scenarios."""
    
    def test_complete_user_journey(self, client):
        """Test complete user journey from registration to data operations."""
        
        # Step 1: User Registration
        register_data = {
            "email": "journey@test.com",
            "name": "Journey Test User",
            "password": "TestPassword123!"
        }
        register_response = client.post("/auth/register", json=register_data)
        assert register_response.status_code == 201
        auth_data = register_response.json()
        headers = {"Authorization": f"Bearer {auth_data['access_token']}"}
        
        # Step 2: Update User Profile
        profile_update = {
            "name": "Updated Journey User"
        }
        profile_response = client.put("/users/me", json=profile_update, headers=headers)
        assert profile_response.status_code == 200
        
        # Step 3: Create Category
        category_data = {
            "name": "Work",
            "color": "#2196F3",
            "icon": "work"
        }
        category_response = client.post("/user-settings/categories", json=category_data, headers=headers)
        assert category_response.status_code == 201
        category_id = category_response.json()["category"]["id"]
        
        # Step 4: Create Todos with Category
        todo_data = {
            "title": "Complete Integration Tests",
            "description": "Finish writing integration tests",
            "priority": "HIGH",
            "todo_type": "TASK",
            "category_id": category_id
        }
        todo_response = client.post("/todos", json=todo_data, headers=headers)
        assert todo_response.status_code == 201
        todo_id = todo_response.json()["id"]
        
        # Step 5: Complete Todo
        toggle_response = client.patch(f"/todos/{todo_id}/toggle", headers=headers)
        assert toggle_response.status_code == 200
        
        # Step 6: Check Statistics
        stats_response = client.get("/todos/stats", headers=headers)
        assert stats_response.status_code == 200
        stats = stats_response.json()
        assert stats["total"] == 1
        assert stats["completed"] == 1
        assert stats["completion_rate"] == 100.0
        
        # Step 7: Export Data
        export_response = client.get("/user-settings/export", headers=headers)
        assert export_response.status_code == 200
        
        # Step 8: Logout
        logout_response = client.post("/auth/logout", headers=headers)
        assert logout_response.status_code == 204