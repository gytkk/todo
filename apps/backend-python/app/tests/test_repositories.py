"""
Test repository implementations.
"""
import pytest
from datetime import datetime
from unittest.mock import AsyncMock, Mock
import json

from app.models.user import User
from app.models.todo import Todo, TodoType, Priority
from app.models.category import Category
from app.repositories.user_repository import UserRepository
from app.repositories.todo_repository import TodoRepository
from app.repositories.category_repository import CategoryRepository


@pytest.fixture
def mock_redis():
    """Mock Redis client."""
    return AsyncMock()


@pytest.fixture
def user_repo(mock_redis):
    """User repository with mock Redis."""
    return UserRepository(mock_redis)


@pytest.fixture
def todo_repo(mock_redis):
    """Todo repository with mock Redis."""
    return TodoRepository(mock_redis)


@pytest.fixture
def category_repo(mock_redis):
    """Category repository with mock Redis."""
    return CategoryRepository(mock_redis)


@pytest.fixture
def sample_user():
    """Sample user for testing."""
    return User(
        id="user-123",
        email="test@example.com",
        name="Test User",
        password_hash="hashed_password",
        email_verified=False,
        is_active=True,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )


@pytest.fixture
def sample_todo():
    """Sample todo for testing."""
    return Todo(
        id="todo-123",
        title="Test Todo",
        description="Test description",
        date=datetime.utcnow(),
        completed=False,
        todo_type=TodoType.TASK,
        priority=Priority.MEDIUM,
        category_id="category-123",
        user_id="user-123",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )


@pytest.fixture
def sample_category():
    """Sample category for testing."""
    return Category(
        id="category-123",
        name="Work",
        color="#3B82F6",
        icon="work",
        order=0,
        user_id="user-123",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )


class TestUserRepository:
    """Test UserRepository."""
    
    @pytest.mark.asyncio
    async def test_find_by_email(self, user_repo, mock_redis, sample_user):
        """Test finding user by email."""
        # Mock Redis responses
        mock_redis.get.return_value = sample_user.id
        mock_redis.hgetall.return_value = user_repo.serialize(sample_user)
        
        result = await user_repo.find_by_email("test@example.com")
        
        assert result is not None
        assert result.email == "test@example.com"
        assert result.id == sample_user.id
    
    @pytest.mark.asyncio
    async def test_find_by_email_not_found(self, user_repo, mock_redis):
        """Test finding user by email when not found."""
        mock_redis.get.return_value = None
        
        result = await user_repo.find_by_email("notfound@example.com")
        
        assert result is None
    
    @pytest.mark.asyncio
    async def test_save_creates_email_index(self, user_repo, mock_redis, sample_user):
        """Test that saving user creates email index."""
        mock_redis.pipeline.return_value = mock_redis
        mock_redis.execute.return_value = None
        
        await user_repo.save(sample_user)
        
        # Verify email index was created
        expected_email_index_key = user_repo.generate_index_key("email", sample_user.email)
        mock_redis.set.assert_called_with(expected_email_index_key, sample_user.id)


class TestTodoRepository:
    """Test TodoRepository."""
    
    @pytest.mark.asyncio
    async def test_find_all_for_user(self, todo_repo, mock_redis, sample_todo):
        """Test finding all todos for user."""
        user_id = "user-123"
        mock_redis.lrange.return_value = [sample_todo.id]
        mock_redis.pipeline.return_value = mock_redis
        mock_redis.execute.return_value = [todo_repo.serialize(sample_todo)]
        
        result = await todo_repo.find_all_for_user(user_id)
        
        assert len(result) == 1
        assert result[0].id == sample_todo.id
        assert result[0].title == sample_todo.title
    
    @pytest.mark.asyncio
    async def test_find_incomplete_for_user(self, todo_repo, mock_redis, sample_todo):
        """Test finding incomplete todos for user."""
        user_id = "user-123"
        mock_redis.smembers.return_value = [sample_todo.id]
        mock_redis.pipeline.return_value = mock_redis
        mock_redis.execute.return_value = [todo_repo.serialize(sample_todo)]
        
        result = await todo_repo.find_incomplete_for_user(user_id)
        
        assert len(result) == 1
        assert not result[0].completed
    
    @pytest.mark.asyncio
    async def test_update_completion_status(self, todo_repo, mock_redis, sample_todo):
        """Test updating todo completion status."""
        user_id = "user-123"
        
        # Mock finding the todo
        mock_redis.hgetall.return_value = todo_repo.serialize(sample_todo)
        mock_redis.pipeline.return_value = mock_redis
        mock_redis.execute.return_value = None
        
        result = await todo_repo.update_completion_status(user_id, sample_todo.id, True)
        
        assert result is not None
        assert result.completed
        assert result.completed_at is not None


class TestCategoryRepository:
    """Test CategoryRepository."""
    
    @pytest.mark.asyncio
    async def test_find_ordered_for_user(self, category_repo, mock_redis):
        """Test finding categories ordered for user."""
        user_id = "user-123"
        
        # Create categories with different orders
        cat1 = Category(
            id="cat-1", name="Work", color="#FF0000", order=1, user_id=user_id,
            created_at=datetime.utcnow(), updated_at=datetime.utcnow()
        )
        cat2 = Category(
            id="cat-2", name="Personal", color="#00FF00", order=0, user_id=user_id,
            created_at=datetime.utcnow(), updated_at=datetime.utcnow()
        )
        
        mock_redis.lrange.return_value = ["cat-1", "cat-2"]
        mock_redis.pipeline.return_value = mock_redis
        mock_redis.execute.return_value = [
            category_repo.serialize(cat1),
            category_repo.serialize(cat2)
        ]
        
        result = await category_repo.find_ordered_for_user(user_id)
        
        assert len(result) == 2
        # Should be ordered by order field (0, 1)
        assert result[0].order == 0
        assert result[1].order == 1
        assert result[0].name == "Personal"
        assert result[1].name == "Work"
    
    @pytest.mark.asyncio
    async def test_get_next_order_for_user(self, category_repo, mock_redis, sample_category):
        """Test getting next order value."""
        user_id = "user-123"
        sample_category.order = 2
        
        mock_redis.lrange.return_value = [sample_category.id]
        mock_redis.pipeline.return_value = mock_redis
        mock_redis.execute.return_value = [category_repo.serialize(sample_category)]
        
        result = await category_repo.get_next_order_for_user(user_id)
        
        assert result == 3  # max order (2) + 1
    
    @pytest.mark.asyncio
    async def test_get_next_order_for_user_empty(self, category_repo, mock_redis):
        """Test getting next order when no categories exist."""
        user_id = "user-123"
        mock_redis.lrange.return_value = []
        
        result = await category_repo.get_next_order_for_user(user_id)
        
        assert result == 0
    
    def test_get_available_colors(self, category_repo):
        """Test getting available colors."""
        colors = category_repo.get_available_colors()
        
        assert isinstance(colors, list)
        assert len(colors) > 0
        assert "#3B82F6" in colors  # Blue should be available
        
        # All colors should be valid hex format
        for color in colors:
            assert color.startswith("#")
            assert len(color) == 7