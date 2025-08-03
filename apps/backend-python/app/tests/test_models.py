"""
Test domain models.
"""
import pytest
from datetime import datetime
from pydantic import ValidationError

from app.models.user import User, UserCreate, UserUpdate
from app.models.todo import Todo, TodoCreate, TodoUpdate, TodoType, Priority
from app.models.category import Category, CategoryCreate, CategoryUpdate
from app.models.user_settings import UserSettings, UserSettingsUpdate, ThemeType


class TestUserModels:
    """Test user-related models."""
    
    def test_user_creation(self):
        """Test User model creation."""
        user = User(
            id="test-id",
            email="test@example.com",
            name="Test User",
            password_hash="hashed_password",
            email_verified=False,
            is_active=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        
        assert user.id == "test-id"
        assert user.email == "test@example.com"
        assert user.name == "Test User"
        assert not user.email_verified
        assert user.is_active
    
    def test_user_create_validation(self):
        """Test UserCreate validation."""
        # Valid creation
        user_create = UserCreate(
            email="test@example.com",
            name="Test User",
            password="password123"
        )
        
        assert user_create.email == "test@example.com"
        assert user_create.name == "Test User"
        assert user_create.password == "password123"
        
        # Invalid email
        with pytest.raises(ValidationError):
            UserCreate(
                email="invalid-email",
                name="Test User",
                password="password123"
            )
        
        # Empty name
        with pytest.raises(ValidationError):
            UserCreate(
                email="test@example.com",
                name="",
                password="password123"
            )
        
        # Short password
        with pytest.raises(ValidationError):
            UserCreate(
                email="test@example.com",
                name="Test User",
                password="short"
            )


class TestTodoModels:
    """Test todo-related models."""
    
    def test_todo_creation(self):
        """Test Todo model creation."""
        todo = Todo(
            id="todo-id",
            title="Test Todo",
            description="Test description",
            date=datetime.utcnow(),
            completed=False,
            todo_type=TodoType.TASK,
            priority=Priority.MEDIUM,
            category_id="category-id",
            user_id="user-id",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        
        assert todo.title == "Test Todo"
        assert todo.todo_type == TodoType.TASK
        assert todo.priority == Priority.MEDIUM
        assert not todo.completed
    
    def test_todo_create_validation(self):
        """Test TodoCreate validation."""
        # Valid creation
        todo_create = TodoCreate(
            title="Test Todo",
            description="Test description",
            date=datetime.utcnow(),
            todo_type=TodoType.TASK,
            priority=Priority.HIGH,
            category_id="category-id"
        )
        
        assert todo_create.title == "Test Todo"
        assert todo_create.todo_type == TodoType.TASK
        assert todo_create.priority == Priority.HIGH
        
        # Empty title
        with pytest.raises(ValidationError):
            TodoCreate(
                title="",
                date=datetime.utcnow(),
                category_id="category-id"
            )
        
        # Long title
        with pytest.raises(ValidationError):
            TodoCreate(
                title="x" * 501,  # Too long
                date=datetime.utcnow(),
                category_id="category-id"
            )


class TestCategoryModels:
    """Test category-related models."""
    
    def test_category_creation(self):
        """Test Category model creation."""
        category = Category(
            id="category-id",
            name="Work",
            color="#FF0000",
            icon="work",
            order=0,
            user_id="user-id",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        
        assert category.name == "Work"
        assert category.color == "#FF0000"
        assert category.icon == "work"
        assert category.order == 0
    
    def test_category_create_validation(self):
        """Test CategoryCreate validation."""
        # Valid creation
        category_create = CategoryCreate(
            name="Work",
            color="#FF0000",
            icon="work"
        )
        
        assert category_create.name == "Work"
        assert category_create.color == "#FF0000"
        
        # Invalid color format
        with pytest.raises(ValidationError):
            CategoryCreate(
                name="Work",
                color="red"  # Invalid hex format
            )
        
        # Empty name
        with pytest.raises(ValidationError):
            CategoryCreate(
                name="",
                color="#FF0000"
            )


class TestUserSettingsModels:
    """Test user settings models."""
    
    def test_user_settings_creation(self):
        """Test UserSettings model creation."""
        settings = UserSettings(
            user_id="user-id",
            theme=ThemeType.DARK,
            language="en",
            theme_color="#3B82F6",
            auto_move_todos=True
        )
        
        assert settings.user_id == "user-id"
        assert settings.theme == ThemeType.DARK
        assert settings.language == "en"
        assert settings.auto_move_todos
    
    def test_user_settings_defaults(self):
        """Test UserSettings default values."""
        settings = UserSettings(user_id="user-id")
        
        assert settings.theme == ThemeType.LIGHT
        assert settings.language == "ko"
        assert settings.theme_color == "#3B82F6"
        assert settings.auto_move_todos
        assert settings.show_weekends
    
    def test_user_settings_validation(self):
        """Test UserSettings validation."""
        # Invalid color
        with pytest.raises(ValidationError):
            UserSettings(
                user_id="user-id",
                theme_color="invalid-color"
            )
        
        # Invalid language
        with pytest.raises(ValidationError):
            UserSettings(
                user_id="user-id",
                language="invalid"
            )
        
        # Invalid old_todo_display_limit
        with pytest.raises(ValidationError):
            UserSettings(
                user_id="user-id",
                old_todo_display_limit=0  # Must be >= 1
            )