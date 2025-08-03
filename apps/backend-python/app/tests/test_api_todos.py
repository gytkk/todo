"""
Test todos API endpoints.
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock
from datetime import datetime
from typing import List

from app.main import app
from app.models.todo import TodoType, Priority
from app.schemas.todo import TodoCreateResponse, TodoUpdateResponse, TodoListResponse, TodoStatsResponse
from app.models.todo import TodoResponse, TodoStats


class TestTodosAPI:
    """Test todos API endpoints."""
    
    @pytest.fixture
    def client(self):
        """Test client."""
        return TestClient(app)
    
    @pytest.fixture
    def mock_todo_response(self):
        """Mock todo response."""
        from app.models.category import CategoryResponse
        return TodoResponse(
            id="test-todo-id",
            title="Test Todo",
            description="Test Description",
            date=datetime.now(),
            completed=False,
            completed_at=None,
            todo_type=TodoType.TASK,
            priority=Priority.MEDIUM,
            category=CategoryResponse(
                id="test-category-id",
                name="Test Category",
                color="#FF0000",
                icon="test-icon",
                order=1,
                user_id="test-user-id",
                created_at=datetime.now(),
                updated_at=datetime.now(),
            ),
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
    
    @pytest.fixture
    def mock_todo_stats(self):
        """Mock todo stats."""
        return TodoStats(
            total=10,
            completed=5,
            incomplete=5,
            completion_rate=0.5,
            recent_completions=3,
            by_type={
                "TASK": {"total": 8, "completed": 4, "incomplete": 4},
                "EVENT": {"total": 2, "completed": 1, "incomplete": 1},
            },
        )
    
    def test_create_todo_success(self, client, mock_todo_response):
        """Test successful todo creation."""
        from app.core.dependencies import get_todo_service, get_current_user_id
        
        # Mock todo service
        mock_todo_service = AsyncMock()
        mock_todo_service.create_todo.return_value = mock_todo_response
        
        # Override dependencies
        app.dependency_overrides[get_todo_service] = lambda: mock_todo_service
        app.dependency_overrides[get_current_user_id] = lambda: "test-user-id"
        
        todo_data = {
            "title": "Test Todo",
            "description": "Test Description",
            "date": "2024-01-01T10:00:00",
            "todo_type": "task",
            "priority": "medium",
            "category_id": "test-category-id",
        }
        headers = {"Authorization": "Bearer test_access_token"}
        response = client.post("/todos", json=todo_data, headers=headers)
        
        assert response.status_code == 201
        data = response.json()
        assert data["todo"]["id"] == "test-todo-id"
        assert data["todo"]["title"] == "Test Todo"
        
        mock_todo_service.create_todo.assert_called_once()
        
        # Cleanup
        app.dependency_overrides.clear()
    
    def test_create_todo_validation_error(self, client):
        """Test todo creation with validation errors."""
        from app.core.dependencies import get_current_user_id
        
        app.dependency_overrides[get_current_user_id] = lambda: "test-user-id"
        
        todo_data = {
            "title": "",  # Invalid empty title
            "date": "invalid-date",
        }
        headers = {"Authorization": "Bearer test_access_token"}
        response = client.post("/todos", json=todo_data, headers=headers)
        
        assert response.status_code == 422
        
        # Cleanup
        app.dependency_overrides.clear()
    
    def test_get_todos_success(self, client, mock_todo_response):
        """Test successful get todos with filters."""
        from app.core.dependencies import get_todo_service, get_current_user_id
        
        # Mock todo service
        mock_todo_service = AsyncMock()
        mock_todo_service.get_todos.return_value = [mock_todo_response]
        
        # Override dependencies
        app.dependency_overrides[get_todo_service] = lambda: mock_todo_service
        app.dependency_overrides[get_current_user_id] = lambda: "test-user-id"
        
        headers = {"Authorization": "Bearer test_access_token"}
        response = client.get(
            "/todos?date=2024-01-01&completed=false&category_id=test-category-id",
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["todos"]
        assert len(data["todos"]) == 1
        assert data["todos"][0]["id"] == "test-todo-id"
        
        mock_todo_service.get_todos.assert_called_once()
        
        # Cleanup
        app.dependency_overrides.clear()
    
    def test_get_todo_by_id_success(self, client, mock_todo_response):
        """Test successful get todo by ID."""
        from app.core.dependencies import get_todo_service, get_current_user_id
        
        # Mock todo service
        mock_todo_service = AsyncMock()
        mock_todo_service.get_todo_by_id.return_value = mock_todo_response
        
        # Override dependencies
        app.dependency_overrides[get_todo_service] = lambda: mock_todo_service
        app.dependency_overrides[get_current_user_id] = lambda: "test-user-id"
        
        headers = {"Authorization": "Bearer test_access_token"}
        response = client.get("/todos/test-todo-id", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["todo"]["id"] == "test-todo-id"
        
        mock_todo_service.get_todo_by_id.assert_called_once_with("test-user-id", "test-todo-id")
        
        # Cleanup
        app.dependency_overrides.clear()
    
    def test_get_todo_by_id_not_found(self, client):
        """Test get todo by ID not found."""
        from app.core.dependencies import get_todo_service, get_current_user_id
        
        # Mock todo service
        mock_todo_service = AsyncMock()
        mock_todo_service.get_todo_by_id.side_effect = ValueError("Todo not found")
        
        # Override dependencies
        app.dependency_overrides[get_todo_service] = lambda: mock_todo_service
        app.dependency_overrides[get_current_user_id] = lambda: "test-user-id"
        
        headers = {"Authorization": "Bearer test_access_token"}
        response = client.get("/todos/nonexistent-id", headers=headers)
        
        assert response.status_code == 404
        data = response.json()
        assert "Todo not found" in data["detail"]
        
        # Cleanup
        app.dependency_overrides.clear()
    
    def test_update_todo_success(self, client, mock_todo_response):
        """Test successful todo update."""
        from app.core.dependencies import get_todo_service, get_current_user_id
        
        # Mock todo service
        mock_todo_service = AsyncMock()
        mock_todo_service.update_todo.return_value = mock_todo_response
        
        # Override dependencies
        app.dependency_overrides[get_todo_service] = lambda: mock_todo_service
        app.dependency_overrides[get_current_user_id] = lambda: "test-user-id"
        
        update_data = {
            "title": "Updated Todo",
            "completed": True,
        }
        headers = {"Authorization": "Bearer test_access_token"}
        response = client.put("/todos/test-todo-id", json=update_data, headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["todo"]["id"] == "test-todo-id"
        
        mock_todo_service.update_todo.assert_called_once()
        
        # Cleanup
        app.dependency_overrides.clear()
    
    def test_toggle_todo_completion_success(self, client, mock_todo_response):
        """Test successful todo completion toggle."""
        from app.core.dependencies import get_todo_service, get_current_user_id
        
        # Mock todo service
        mock_todo_response.completed = True
        mock_todo_service = AsyncMock()
        mock_todo_service.toggle_completion.return_value = mock_todo_response
        
        # Override dependencies
        app.dependency_overrides[get_todo_service] = lambda: mock_todo_service
        app.dependency_overrides[get_current_user_id] = lambda: "test-user-id"
        
        headers = {"Authorization": "Bearer test_access_token"}
        response = client.patch("/todos/test-todo-id/toggle", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["todo"]["completed"] == True
        assert "toggled" in data["message"]
        
        mock_todo_service.toggle_completion.assert_called_once_with("test-user-id", "test-todo-id")
        
        # Cleanup
        app.dependency_overrides.clear()
    
    def test_delete_todo_success(self, client):
        """Test successful todo deletion."""
        from app.core.dependencies import get_todo_service, get_current_user_id
        
        # Mock todo service
        mock_todo_service = AsyncMock()
        mock_todo_service.delete_todo.return_value = None
        
        # Override dependencies
        app.dependency_overrides[get_todo_service] = lambda: mock_todo_service
        app.dependency_overrides[get_current_user_id] = lambda: "test-user-id"
        
        headers = {"Authorization": "Bearer test_access_token"}
        response = client.delete("/todos/test-todo-id", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["deleted_id"] == "test-todo-id"
        
        mock_todo_service.delete_todo.assert_called_once_with("test-user-id", "test-todo-id")
        
        # Cleanup
        app.dependency_overrides.clear()
    
    def test_delete_all_todos_success(self, client):
        """Test successful delete all todos."""
        from app.core.dependencies import get_todo_service, get_current_user_id
        
        # Mock todo service
        mock_todo_service = AsyncMock()
        mock_todo_service.delete_all_todos.return_value = 5  # 5 todos deleted
        
        # Override dependencies
        app.dependency_overrides[get_todo_service] = lambda: mock_todo_service
        app.dependency_overrides[get_current_user_id] = lambda: "test-user-id"
        
        headers = {"Authorization": "Bearer test_access_token"}
        response = client.delete("/todos", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["deleted_count"] == 5
        
        mock_todo_service.delete_all_todos.assert_called_once_with("test-user-id")
        
        # Cleanup
        app.dependency_overrides.clear()
    
    def test_get_todo_stats_success(self, client, mock_todo_stats):
        """Test successful get todo statistics."""
        from app.core.dependencies import get_todo_service, get_current_user_id
        
        # Mock todo service
        mock_todo_service = AsyncMock()
        mock_todo_service.get_statistics.return_value = mock_todo_stats
        
        # Override dependencies
        app.dependency_overrides[get_todo_service] = lambda: mock_todo_service
        app.dependency_overrides[get_current_user_id] = lambda: "test-user-id"
        
        headers = {"Authorization": "Bearer test_access_token"}
        response = client.get("/todos/stats", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["stats"]["total"] == 10
        assert data["stats"]["completed"] == 5
        assert data["stats"]["completion_rate"] == 0.5
        
        mock_todo_service.get_statistics.assert_called_once_with("test-user-id")
        
        # Cleanup
        app.dependency_overrides.clear()
    
    def test_move_tasks_success(self, client):
        """Test successful move tasks to new dates."""
        from app.core.dependencies import get_todo_service, get_current_user_id
        
        # Mock todo service
        mock_todo_service = AsyncMock()
        mock_todo_service.move_incomplete_tasks.return_value = 3  # 3 tasks moved
        
        # Override dependencies
        app.dependency_overrides[get_todo_service] = lambda: mock_todo_service
        app.dependency_overrides[get_current_user_id] = lambda: "test-user-id"
        
        move_data = {
            "from_date": "2024-01-01",
            "to_date": "2024-01-02",
        }
        headers = {"Authorization": "Bearer test_access_token"}
        response = client.post("/todos/move-tasks", json=move_data, headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["moved_count"] == 3
        assert "moved" in data["message"]
        
        mock_todo_service.move_incomplete_tasks.assert_called_once()
        
        # Cleanup
        app.dependency_overrides.clear()
    
    def test_get_tasks_due_success(self, client, mock_todo_response):
        """Test successful get tasks due for movement."""
        from app.core.dependencies import get_todo_service, get_current_user_id
        
        # Mock todo service
        mock_todo_service = AsyncMock()
        mock_todo_service.get_tasks_due_for_movement.return_value = [mock_todo_response]
        
        # Override dependencies
        app.dependency_overrides[get_todo_service] = lambda: mock_todo_service
        app.dependency_overrides[get_current_user_id] = lambda: "test-user-id"
        
        headers = {"Authorization": "Bearer test_access_token"}
        response = client.get("/todos/tasks-due?days_overdue=7", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["tasks"]
        assert len(data["tasks"]) == 1
        assert data["tasks"][0]["id"] == "test-todo-id"
        
        mock_todo_service.get_tasks_due_for_movement.assert_called_once()
        
        # Cleanup
        app.dependency_overrides.clear()