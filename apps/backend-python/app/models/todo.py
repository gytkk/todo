"""
Todo domain models.
"""
from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field, validator

from .base import BaseEntityModel
from .category import CategoryResponse


class TodoType(str, Enum):
    """Todo type enumeration."""
    
    EVENT = "event"  # Fixed date todos
    TASK = "task"    # Moveable todos


class Priority(str, Enum):
    """Todo priority enumeration."""
    
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class Todo(BaseEntityModel):
    """Todo entity model."""
    
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = Field(None, max_length=2000)
    date: datetime
    completed: bool = False
    completed_at: Optional[datetime] = None
    todo_type: TodoType = TodoType.TASK
    priority: Priority = Priority.MEDIUM
    category_id: str
    user_id: str


class TodoCreate(BaseModel):
    """Todo creation model."""
    
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = Field(None, max_length=2000)
    date: datetime
    todo_type: TodoType = TodoType.TASK
    priority: Priority = Priority.MEDIUM
    category_id: str
    
    @validator('title')
    def validate_title(cls, v):
        if not v or not v.strip():
            raise ValueError('Todo title cannot be empty')
        return v.strip()


class TodoUpdate(BaseModel):
    """Todo update model."""
    
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = Field(None, max_length=2000)
    date: Optional[datetime] = None
    completed: Optional[bool] = None
    todo_type: Optional[TodoType] = None
    priority: Optional[Priority] = None
    category_id: Optional[str] = None
    
    @validator('title')
    def validate_title(cls, v):
        if v is not None and (not v or not v.strip()):
            raise ValueError('Todo title cannot be empty')
        return v.strip() if v else v


class TodoResponse(BaseModel):
    """Todo response model."""
    
    id: str
    title: str
    description: Optional[str]
    date: datetime
    completed: bool
    completed_at: Optional[datetime]
    todo_type: TodoType
    priority: Priority
    category: CategoryResponse
    created_at: datetime
    updated_at: datetime


class TodoStats(BaseModel):
    """Todo statistics model."""
    
    total: int
    completed: int
    incomplete: int
    completion_rate: float
    recent_completions: int
    by_type: dict[str, dict[str, int]]  # Type -> {total, completed, incomplete}


class TodoStatsResponse(BaseModel):
    """Todo statistics response."""
    
    stats: TodoStats


class MoveTasksRequest(BaseModel):
    """Move incomplete tasks request."""
    
    from_date: datetime
    to_date: datetime


class MoveTasksResponse(BaseModel):
    """Move tasks response."""
    
    moved_count: int
    moved_todos: list[TodoResponse]


class TasksDueResponse(BaseModel):
    """Tasks due for movement response."""
    
    count: int
    dates: list[datetime]