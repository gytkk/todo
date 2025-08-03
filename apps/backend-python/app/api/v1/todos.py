"""
Todos API endpoints.
"""
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.schemas.todo import (
    TodoCreateRequest,
    TodoUpdateRequest,
    TodoCreateResponse,
    TodoUpdateResponse,
    TodoListResponse,
    TodoStatsResponse,
    ToggleTodoResponse,
    DeleteTodoResponse,
    DeleteAllTodosResponse,
)
from app.models.todo import TodoType, Priority
from app.services.todo_service import TodoService
from app.core.dependencies import get_todo_service, get_current_user_id

router = APIRouter()


@router.post(
    "", 
    response_model=TodoCreateResponse, 
    status_code=status.HTTP_201_CREATED,
    summary="새 할 일 생성",
    description="""
    새로운 할 일을 생성합니다.
    
    - **title**: 할 일 제목 (필수)
    - **description**: 할 일 설명 (선택사항)
    - **due_date**: 마감일 (YYYY-MM-DD 형식, 선택사항)
    - **priority**: 우선순위 (LOW, MEDIUM, HIGH)
    - **todo_type**: 할 일 타입 (TASK 또는 EVENT)
    - **category_id**: 카테고리 ID (선택사항)
    
    **인증 필요**: Bearer 토큰
    """,
    responses={
        201: {
            "description": "할 일 생성 성공",
            "content": {
                "application/json": {
                    "example": {
                        "id": "550e8400-e29b-41d4-a716-446655440000",
                        "title": "프로젝트 회의 준비",
                        "description": "내일 프로젝트 회의를 위한 자료 준비",
                        "due_date": "2024-12-31",
                        "priority": "HIGH",
                        "todo_type": "TASK",
                        "is_completed": False,
                        "category_id": "category-123",
                        "user_id": "user-456",
                        "created_at": "2024-01-15T10:30:00Z",
                        "updated_at": "2024-01-15T10:30:00Z"
                    }
                }
            }
        },
        400: {
            "description": "잘못된 요청 데이터",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "Title is required"
                    }
                }
            }
        },
        401: {
            "description": "인증되지 않은 사용자",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "Could not validate credentials"
                    }
                }
            }
        }
    }
)
async def create_todo(
    todo_data: TodoCreateRequest,
    current_user_id: str = Depends(get_current_user_id),
    todo_service: TodoService = Depends(get_todo_service),
) -> TodoCreateResponse:
    """새로운 할 일을 생성합니다."""
    try:
        from app.schemas.todo import TodoCreate
        todo_create = TodoCreate(
            title=todo_data.title,
            description=todo_data.description,
            date=todo_data.date,
            todo_type=todo_data.todo_type,
            priority=todo_data.priority,
            category_id=todo_data.category_id,
        )
        todo = await todo_service.create_todo(current_user_id, todo_create)
        return TodoCreateResponse(todo=todo)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get("", response_model=TodoListResponse)
async def get_todos(
    current_user_id: str = Depends(get_current_user_id),
    todo_service: TodoService = Depends(get_todo_service),
    date: Optional[date] = Query(None, description="Filter by date"),
    completed: Optional[bool] = Query(None, description="Filter by completion status"),
    todo_type: Optional[TodoType] = Query(None, description="Filter by todo type"),
    priority: Optional[Priority] = Query(None, description="Filter by priority"),
    category_id: Optional[str] = Query(None, description="Filter by category"),
) -> TodoListResponse:
    """Get todos with optional filters."""
    try:
        filters = {}
        if date is not None:
            filters["date"] = date
        if completed is not None:
            filters["completed"] = completed
        if todo_type is not None:
            filters["todo_type"] = todo_type
        if priority is not None:
            filters["priority"] = priority
        if category_id is not None:
            filters["category_id"] = category_id
        
        todos = await todo_service.get_todos(current_user_id, filters)
        return TodoListResponse(todos=todos)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get("/stats", response_model=TodoStatsResponse)
async def get_todo_stats(
    current_user_id: str = Depends(get_current_user_id),
    todo_service: TodoService = Depends(get_todo_service),
) -> TodoStatsResponse:
    """Get todo statistics."""
    try:
        stats = await todo_service.get_statistics(current_user_id)
        return TodoStatsResponse(stats=stats)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/move-tasks")
async def move_tasks(
    move_data: dict,
    current_user_id: str = Depends(get_current_user_id),
    todo_service: TodoService = Depends(get_todo_service),
) -> dict:
    """Move incomplete tasks to new dates."""
    try:
        from_date = move_data.get("from_date")
        to_date = move_data.get("to_date")
        
        if not from_date or not to_date:
            raise ValueError("Both from_date and to_date are required")
        
        moved_count = await todo_service.move_incomplete_tasks(
            current_user_id, from_date, to_date
        )
        return {
            "moved_count": moved_count,
            "message": f"Successfully moved {moved_count} incomplete tasks",
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get("/tasks-due")
async def get_tasks_due(
    current_user_id: str = Depends(get_current_user_id),
    todo_service: TodoService = Depends(get_todo_service),
    days_overdue: int = Query(7, description="Number of days overdue"),
) -> dict:
    """Get tasks due for movement."""
    try:
        tasks = await todo_service.get_tasks_due_for_movement(current_user_id, days_overdue)
        return {
            "tasks": tasks,
            "count": len(tasks),
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get("/{todo_id}", response_model=TodoCreateResponse)
async def get_todo_by_id(
    todo_id: str,
    current_user_id: str = Depends(get_current_user_id),
    todo_service: TodoService = Depends(get_todo_service),
) -> TodoCreateResponse:
    """Get todo by ID."""
    try:
        todo = await todo_service.get_todo_by_id(current_user_id, todo_id)
        return TodoCreateResponse(todo=todo)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.put("/{todo_id}", response_model=TodoUpdateResponse)
async def update_todo(
    todo_id: str,
    update_data: TodoUpdateRequest,
    current_user_id: str = Depends(get_current_user_id),
    todo_service: TodoService = Depends(get_todo_service),
) -> TodoUpdateResponse:
    """Update todo by ID."""
    try:
        from app.schemas.todo import TodoUpdate
        todo_update = TodoUpdate(
            title=update_data.title,
            description=update_data.description,
            date=update_data.date,
            completed=update_data.completed,
            todo_type=update_data.todo_type,
            priority=update_data.priority,
            category_id=update_data.category_id,
        )
        todo = await todo_service.update_todo(current_user_id, todo_id, todo_update)
        return TodoUpdateResponse(todo=todo)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.patch("/{todo_id}/toggle", response_model=ToggleTodoResponse)
async def toggle_todo_completion(
    todo_id: str,
    current_user_id: str = Depends(get_current_user_id),
    todo_service: TodoService = Depends(get_todo_service),
) -> ToggleTodoResponse:
    """Toggle todo completion status."""
    try:
        todo = await todo_service.toggle_completion(current_user_id, todo_id)
        status_text = "completed" if todo.completed else "incomplete"
        return ToggleTodoResponse(
            todo=todo,
            message=f"Todo toggled to {status_text}",
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.delete("/{todo_id}", response_model=DeleteTodoResponse)
async def delete_todo(
    todo_id: str,
    current_user_id: str = Depends(get_current_user_id),
    todo_service: TodoService = Depends(get_todo_service),
) -> DeleteTodoResponse:
    """Delete todo by ID."""
    try:
        await todo_service.delete_todo(current_user_id, todo_id)
        return DeleteTodoResponse(deleted_id=todo_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.delete("", response_model=DeleteAllTodosResponse)
async def delete_all_todos(
    current_user_id: str = Depends(get_current_user_id),
    todo_service: TodoService = Depends(get_todo_service),
) -> DeleteAllTodosResponse:
    """Delete all todos for current user."""
    try:
        deleted_count = await todo_service.delete_all_todos(current_user_id)
        return DeleteAllTodosResponse(deleted_count=deleted_count)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )