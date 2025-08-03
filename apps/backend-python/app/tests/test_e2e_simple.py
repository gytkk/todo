"""
Simplified E2E integration tests for the FastAPI application.

These tests use a simpler approach to avoid asyncio event loop issues
while still testing the full integration flow.
"""
import pytest
import uuid
from fastapi.testclient import TestClient

from app.main import app


@pytest.mark.integration
class TestE2EIntegration:
    """Simplified E2E integration tests."""
    
    @pytest.fixture(scope="class")
    def client(self):
        """Test client for E2E tests."""
        return TestClient(app)
    
    @pytest.fixture(scope="class")
    def unique_id(self):
        """Generate unique ID for test isolation."""
        return str(uuid.uuid4())[:8]
    
    def test_auth_registration_flow(self, client, unique_id):
        """Test user registration flow."""
        register_data = {
            "email": f"e2e-register-{unique_id}@test.com",
            "name": "E2E Test User",
            "password": "TestPassword123!"
        }
        
        response = client.post("/auth/register", json=register_data)
        
        assert response.status_code == 201
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["user"]["email"] == f"e2e-register-{unique_id}@test.com"
        assert data["user"]["name"] == "E2E Test User"
        assert "user_settings" in data
        
        return data  # Return for use in subsequent tests
    
    def test_auth_login_flow(self, client, unique_id):
        """Test user login flow."""
        # First register a user
        register_data = {
            "email": f"e2e-login-{unique_id}@test.com",
            "name": "E2E Login User",
            "password": "TestPassword123!"
        }
        register_response = client.post("/auth/register", json=register_data)
        assert register_response.status_code == 201
        
        # Now test login
        login_data = {
            "email": f"e2e-login-{unique_id}@test.com",
            "password": "TestPassword123!",
            "remember_me": False
        }
        
        response = client.post("/auth/login", json=login_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["user"]["email"] == f"e2e-login-{unique_id}@test.com"
    
    def test_auth_token_refresh_flow(self, client, unique_id):
        """Test token refresh flow."""
        # Register and get tokens
        register_data = {
            "email": f"e2e-refresh-{unique_id}@test.com",
            "name": "E2E Refresh User",
            "password": "TestPassword123!"
        }
        register_response = client.post("/auth/register", json=register_data)
        auth_data = register_response.json()
        
        # Test token refresh
        refresh_data = {
            "refresh_token": auth_data["refresh_token"]
        }
        
        response = client.post("/auth/refresh", json=refresh_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["user"]["email"] == f"e2e-refresh-{unique_id}@test.com"
    
    def test_user_profile_flow(self, client, unique_id):
        """Test user profile management."""
        # Register user
        register_data = {
            "email": f"e2e-profile-{unique_id}@test.com",
            "name": "E2E Profile User",
            "password": "TestPassword123!"
        }
        register_response = client.post("/auth/register", json=register_data)
        auth_data = register_response.json()
        headers = {"Authorization": f"Bearer {auth_data['access_token']}"}
        
        # Get profile
        profile_response = client.get("/users/me", headers=headers)
        assert profile_response.status_code == 200
        profile_data = profile_response.json()
        assert profile_data["email"] == f"e2e-profile-{unique_id}@test.com"
        
        # Update profile
        update_data = {
            "name": "Updated E2E Profile User"
        }
        update_response = client.put("/users/me", json=update_data, headers=headers)
        assert update_response.status_code == 200
        updated_profile = update_response.json()
        assert updated_profile["user"]["name"] == "Updated E2E Profile User"
    
    def test_todo_crud_flow(self, client, unique_id):
        """Test Todo CRUD operations."""
        # Register user
        register_data = {
            "email": f"e2e-todo-{unique_id}@test.com",
            "name": "E2E Todo User",
            "password": "TestPassword123!"
        }
        register_response = client.post("/auth/register", json=register_data)
        auth_data = register_response.json()
        headers = {"Authorization": f"Bearer {auth_data['access_token']}"}
        
        # Create todo
        todo_data = {
            "title": "E2E Test Todo",
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
        assert created_todo["title"] == "E2E Test Todo"
        assert created_todo["is_completed"] is False
        
        # Get todos
        list_response = client.get("/todos", headers=headers)
        assert list_response.status_code == 200
        todos = list_response.json()
        assert len(todos) >= 1
        assert any(todo["id"] == todo_id for todo in todos)
        
        # Update todo
        update_data = {
            "title": "Updated E2E Test Todo",
            "description": "Updated description",
            "priority": "HIGH"
        }
        update_response = client.put(f"/todos/{todo_id}", json=update_data, headers=headers)
        assert update_response.status_code == 200
        updated_todo = update_response.json()
        assert updated_todo["title"] == "Updated E2E Test Todo"
        assert updated_todo["priority"] == "HIGH"
        
        # Toggle completion
        toggle_response = client.patch(f"/todos/{todo_id}/toggle", headers=headers)
        assert toggle_response.status_code == 200
        toggled_todo = toggle_response.json()
        assert toggled_todo["is_completed"] is True
        
        # Delete todo
        delete_response = client.delete(f"/todos/{todo_id}", headers=headers)
        assert delete_response.status_code == 204
    
    def test_todo_stats_flow(self, client, unique_id):
        """Test todo statistics."""
        # Register user
        register_data = {
            "email": f"e2e-stats-{unique_id}@test.com",
            "name": "E2E Stats User",
            "password": "TestPassword123!"
        }
        register_response = client.post("/auth/register", json=register_data)
        auth_data = register_response.json()
        headers = {"Authorization": f"Bearer {auth_data['access_token']}"}
        
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
            }
        ]
        
        for todo_data in todos_data:
            response = client.post("/todos", json=todo_data, headers=headers)
            assert response.status_code == 201
        
        # Get stats
        stats_response = client.get("/todos/stats", headers=headers)
        assert stats_response.status_code == 200
        stats = stats_response.json()
        
        assert stats["total"] >= 2
        assert stats["completed"] >= 1
        assert stats["pending"] >= 1
        assert "completion_rate" in stats
    
    def test_user_settings_flow(self, client, unique_id):
        """Test user settings management."""
        # Register user
        register_data = {
            "email": f"e2e-settings-{unique_id}@test.com",
            "name": "E2E Settings User",
            "password": "TestPassword123!"
        }
        register_response = client.post("/auth/register", json=register_data)
        auth_data = register_response.json()
        headers = {"Authorization": f"Bearer {auth_data['access_token']}"}
        
        # Get initial settings
        get_response = client.get("/user-settings", headers=headers)
        assert get_response.status_code == 200
        settings = get_response.json()
        assert settings["user_id"] == auth_data["user"]["id"]
        
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
    
    def test_category_management_flow(self, client, unique_id):
        """Test category management."""
        # Register user
        register_data = {
            "email": f"e2e-category-{unique_id}@test.com",
            "name": "E2E Category User",
            "password": "TestPassword123!"
        }
        register_response = client.post("/auth/register", json=register_data)
        auth_data = register_response.json()
        headers = {"Authorization": f"Bearer {auth_data['access_token']}"}
        
        # Create category
        category_data = {
            "name": "E2E Test Category",
            "color": "#FF5722",
            "icon": "work"
        }
        create_response = client.post("/user-settings/categories", json=category_data, headers=headers)
        assert create_response.status_code == 201
        created_category = create_response.json()["category"]
        category_id = created_category["id"]
        assert created_category["name"] == "E2E Test Category"
        
        # Get categories
        list_response = client.get("/user-settings/categories", headers=headers)
        assert list_response.status_code == 200
        categories = list_response.json()["categories"]
        assert len(categories) >= 1
        assert any(cat["id"] == category_id for cat in categories)
        
        # Update category
        update_data = {
            "name": "Updated E2E Category",
            "color": "#2196F3"
        }
        update_response = client.put(f"/user-settings/categories/{category_id}", json=update_data, headers=headers)
        assert update_response.status_code == 200
        updated_category = update_response.json()["category"]
        assert updated_category["name"] == "Updated E2E Category"
        assert updated_category["color"] == "#2196F3"
        
        # Delete category
        delete_response = client.delete(f"/user-settings/categories/{category_id}", headers=headers)
        assert delete_response.status_code == 200
    
    def test_complete_user_journey(self, client, unique_id):
        """Test complete user journey from registration to data operations."""
        
        # Step 1: User Registration
        register_data = {
            "email": f"e2e-journey-{unique_id}@test.com",
            "name": "E2E Journey User",
            "password": "TestPassword123!"
        }
        register_response = client.post("/auth/register", json=register_data)
        assert register_response.status_code == 201
        auth_data = register_response.json()
        headers = {"Authorization": f"Bearer {auth_data['access_token']}"}
        
        # Step 2: Update User Profile
        profile_update = {
            "name": "Updated E2E Journey User"
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
        
        # Step 4: Create Todo with Category
        todo_data = {
            "title": "Complete E2E Tests",
            "description": "Finish E2E integration tests",
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
        assert stats["total"] >= 1
        assert stats["completed"] >= 1
        
        # Step 7: Export Data
        export_response = client.get("/user-settings/export", headers=headers)
        assert export_response.status_code == 200
        
        # Step 8: Update Settings
        settings_update = {
            "theme": "dark",
            "language": "en"
        }
        settings_response = client.put("/user-settings", json=settings_update, headers=headers)
        assert settings_response.status_code == 200
        
        # Step 9: Logout
        logout_response = client.post("/auth/logout", headers=headers)
        assert logout_response.status_code == 204