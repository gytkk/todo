"""
Final E2E integration tests with proper fixture management.

This approach uses proper pytest fixtures to avoid asyncio event loop issues.
"""
import pytest
import uuid
import asyncio
from fastapi.testclient import TestClient
from typing import Dict, Any

from app.main import app


class TestE2EFinal:
    """Final E2E integration tests with proper lifecycle management."""
    
    @pytest.fixture(scope="function")
    def client(self):
        """Test client for E2E tests."""
        return TestClient(app)
    
    @pytest.fixture(scope="function")
    def unique_id(self):
        """Generate unique ID for test isolation."""
        return str(uuid.uuid4())[:8]
    
    @pytest.fixture(scope="function")
    def cleanup_redis(self):
        """Clean up Redis before each test."""
        import redis
        try:
            r = redis.Redis(host='localhost', port=6379, password='todoapp123', db=15)
            r.flushdb()
            yield
            r.flushdb()
        except Exception:
            pytest.skip("Redis not available for E2E tests")
    
    def test_complete_user_flow(self, client, unique_id, cleanup_redis):
        """Test complete user flow in a single test to avoid event loop issues."""
        
        # Step 1: User Registration
        register_data = {
            "email": f"complete-{unique_id}@test.com",
            "name": "Complete Test User",
            "password": "TestPassword123!"
        }
        
        register_response = client.post("/auth/register", json=register_data)
        assert register_response.status_code == 201
        auth_data = register_response.json()
        headers = {"Authorization": f"Bearer {auth_data['access_token']}"}
        
        # Verify registration response
        assert "access_token" in auth_data
        assert "refresh_token" in auth_data
        assert auth_data["user"]["email"] == f"complete-{unique_id}@test.com"
        assert auth_data["user"]["name"] == "Complete Test User"
        assert "user_settings" in auth_data
        
        # Step 2: Login Flow
        login_data = {
            "email": f"complete-{unique_id}@test.com",
            "password": "TestPassword123!",
            "remember_me": False
        }
        login_response = client.post("/auth/login", json=login_data)
        assert login_response.status_code == 200
        login_auth = login_response.json()
        assert login_auth["user"]["email"] == f"complete-{unique_id}@test.com"
        
        # Update headers with new token
        headers = {"Authorization": f"Bearer {login_auth['access_token']}"}
        
        # Step 3: User Profile Management
        profile_response = client.get("/users/me", headers=headers)
        assert profile_response.status_code == 200
        profile_data = profile_response.json()
        assert profile_data["email"] == f"complete-{unique_id}@test.com"
        
        # Update profile
        update_data = {"name": "Updated Complete User"}
        update_response = client.put("/users/me", json=update_data, headers=headers)
        assert update_response.status_code == 200
        updated_profile = update_response.json()
        assert updated_profile["user"]["name"] == "Updated Complete User"
        
        # Step 4: User Settings Management
        settings_response = client.get("/user-settings", headers=headers)
        assert settings_response.status_code == 200
        settings = settings_response.json()
        assert settings["user_id"] == auth_data["user"]["id"]
        
        # Update settings
        settings_update = {
            "theme": "dark",
            "language": "en",
            "theme_color": "#FF5722"
        }
        settings_update_response = client.put("/user-settings", json=settings_update, headers=headers)
        assert settings_update_response.status_code == 200
        updated_settings = settings_update_response.json()
        assert updated_settings["theme"] == "dark"
        assert updated_settings["language"] == "en"
        assert updated_settings["theme_color"] == "#FF5722"
        
        # Step 5: Category Management
        category_data = {
            "name": "Complete Test Category",
            "color": "#2196F3",
            "icon": "work"
        }
        category_response = client.post("/user-settings/categories", json=category_data, headers=headers)
        assert category_response.status_code == 201
        created_category = category_response.json()["category"]
        category_id = created_category["id"]
        assert created_category["name"] == "Complete Test Category"
        
        # Get categories
        categories_response = client.get("/user-settings/categories", headers=headers)
        assert categories_response.status_code == 200
        categories = categories_response.json()["categories"]
        assert len(categories) >= 1
        assert any(cat["id"] == category_id for cat in categories)
        
        # Step 6: Todo Management
        todo_data = {
            "title": "Complete Test Todo",
            "description": "Test todo description",
            "priority": "HIGH",
            "todo_type": "TASK",
            "category_id": category_id
        }
        
        todo_response = client.post("/todos", json=todo_data, headers=headers)
        assert todo_response.status_code == 201
        created_todo = todo_response.json()
        todo_id = created_todo["id"]
        assert created_todo["title"] == "Complete Test Todo"
        assert created_todo["is_completed"] is False
        assert created_todo["category_id"] == category_id
        
        # Get todos
        todos_response = client.get("/todos", headers=headers)
        assert todos_response.status_code == 200
        todos = todos_response.json()
        assert len(todos) >= 1
        assert any(todo["id"] == todo_id for todo in todos)
        
        # Update todo
        todo_update = {
            "title": "Updated Complete Test Todo",
            "description": "Updated description",
            "priority": "MEDIUM"
        }
        todo_update_response = client.put(f"/todos/{todo_id}", json=todo_update, headers=headers)
        assert todo_update_response.status_code == 200
        updated_todo = todo_update_response.json()
        assert updated_todo["title"] == "Updated Complete Test Todo"
        assert updated_todo["priority"] == "MEDIUM"
        
        # Toggle todo completion
        toggle_response = client.patch(f"/todos/{todo_id}/toggle", headers=headers)
        assert toggle_response.status_code == 200
        toggled_todo = toggle_response.json()
        assert toggled_todo["is_completed"] is True
        
        # Step 7: Statistics
        stats_response = client.get("/todos/stats", headers=headers)
        assert stats_response.status_code == 200
        stats = stats_response.json()
        assert stats["total"] >= 1
        assert stats["completed"] >= 1
        assert "completion_rate" in stats
        
        # Step 8: Data Export
        export_response = client.get("/user-settings/export", headers=headers)
        assert export_response.status_code == 200
        export_data = export_response.json()
        assert "settings" in export_data
        assert "categories" in export_data
        assert "todos" in export_data
        
        # Step 9: Token Refresh
        refresh_data = {"refresh_token": auth_data["refresh_token"]}
        refresh_response = client.post("/auth/refresh", json=refresh_data)
        assert refresh_response.status_code == 200
        refresh_auth = refresh_response.json()
        assert "access_token" in refresh_auth
        assert "refresh_token" in refresh_auth
        
        # Step 10: Cleanup - Delete todo
        delete_todo_response = client.delete(f"/todos/{todo_id}", headers=headers)
        assert delete_todo_response.status_code == 204
        
        # Delete category
        delete_category_response = client.delete(f"/user-settings/categories/{category_id}", headers=headers)
        assert delete_category_response.status_code == 200
        
        # Step 11: Logout
        logout_response = client.post("/auth/logout", headers=headers)
        assert logout_response.status_code == 204
        
        # Verify logout (should fail to access protected endpoint)
        protected_response = client.get("/users/me", headers=headers)
        assert protected_response.status_code == 401
        
        print("✅ Complete E2E user flow test passed successfully!")
    
    def test_authentication_flows(self, client, unique_id, cleanup_redis):
        """Test various authentication flows."""
        
        # Registration
        register_data = {
            "email": f"auth-{unique_id}@test.com",
            "name": "Auth Test User",
            "password": "TestPassword123!"
        }
        register_response = client.post("/auth/register", json=register_data)
        assert register_response.status_code == 201
        auth_data = register_response.json()
        
        # Login
        login_data = {
            "email": f"auth-{unique_id}@test.com",
            "password": "TestPassword123!",
            "remember_me": True
        }
        login_response = client.post("/auth/login", json=login_data)
        assert login_response.status_code == 200
        login_auth = login_response.json()
        
        # Token refresh
        refresh_data = {"refresh_token": login_auth["refresh_token"]}
        refresh_response = client.post("/auth/refresh", json=refresh_data)
        assert refresh_response.status_code == 200
        
        # Logout
        headers = {"Authorization": f"Bearer {login_auth['access_token']}"}
        logout_response = client.post("/auth/logout", headers=headers)
        assert logout_response.status_code == 204
        
        print("✅ Authentication flows test passed successfully!")
    
    def test_todo_operations(self, client, unique_id, cleanup_redis):
        """Test todo operations comprehensively."""
        
        # Setup user
        register_data = {
            "email": f"todo-ops-{unique_id}@test.com",
            "name": "Todo Ops User",
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
            },
            {
                "title": "Todo 3",
                "priority": "LOW",
                "todo_type": "TASK",
                "is_completed": False
            }
        ]
        
        created_todos = []
        for todo_data in todos_data:
            response = client.post("/todos", json=todo_data, headers=headers)
            assert response.status_code == 201
            created_todos.append(response.json())
        
        # Test filtering and retrieval
        all_todos_response = client.get("/todos", headers=headers)
        assert all_todos_response.status_code == 200
        all_todos = all_todos_response.json()
        assert len(all_todos) >= 3
        
        # Test individual todo retrieval
        for todo in created_todos:
            get_response = client.get(f"/todos/{todo['id']}", headers=headers)
            assert get_response.status_code == 200
            retrieved_todo = get_response.json()
            assert retrieved_todo["id"] == todo["id"]
        
        # Test stats
        stats_response = client.get("/todos/stats", headers=headers)
        assert stats_response.status_code == 200
        stats = stats_response.json()
        assert stats["total"] >= 3
        assert stats["completed"] >= 1
        assert stats["pending"] >= 2
        
        print("✅ Todo operations test passed successfully!")