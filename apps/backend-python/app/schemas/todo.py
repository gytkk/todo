"""
Todo-related request/response schemas.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.todo import TodoResponse, TodoStats, TodoType, Priority


class TodoCreateRequest(BaseModel):
    """Create todo request schema."""
    
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = Field(None, max_length=2000)
    date: datetime
    todo_type: TodoType = TodoType.TASK
    priority: Priority = Priority.MEDIUM
    category_id: str


class TodoUpdateRequest(BaseModel):
    """Update todo request schema."""
    
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = Field(None, max_length=2000)
    date: Optional[datetime] = None
    completed: Optional[bool] = None
    todo_type: Optional[TodoType] = None
    priority: Optional[Priority] = None
    category_id: Optional[str] = None


class TodoCreateResponse(BaseModel):
    """Create todo response schema."""
    
    todo: TodoResponse


class TodoUpdateResponse(BaseModel):
    """Update todo response schema."""
    
    todo: TodoResponse


class TodoListResponse(BaseModel):
    """Todo list response schema."""
    
    todos: list[TodoResponse]
    stats: Optional[TodoStats] = None


class TodoStatsResponse(BaseModel):
    """Todo statistics response schema."""
    
    stats: TodoStats


class ToggleTodoResponse(BaseModel):
    """Toggle todo completion response schema."""
    
    todo: TodoResponse
    message: str


class DeleteTodoResponse(BaseModel):
    """Delete todo response schema."""
    
    success: bool = True
    deleted_id: str
    message: str = "Todo deleted successfully"


class DeleteAllTodosResponse(BaseModel):
    """Delete all todos response schema."""
    
    success: bool = True
    deleted_count: int
    message: str = "All todos deleted successfully"