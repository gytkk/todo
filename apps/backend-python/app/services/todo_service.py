"""
Todo service for todo management operations.
"""
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta

from app.models.todo import Todo, TodoType
from app.models.category import Category
from app.repositories.todo_repository import TodoRepository
from app.repositories.category_repository import CategoryRepository
from app.schemas.todo import TodoCreate, TodoUpdate, TodoResponse, TodoStats


class TodoService:
    """Service for todo management operations."""
    
    def __init__(
        self,
        todo_repository: TodoRepository,
        category_repository: CategoryRepository,
    ):
        self.todo_repository = todo_repository
        self.category_repository = category_repository
    
    async def create_todo(
        self, user_id: str, todo_data: TodoCreate
    ) -> TodoResponse:
        """Create a new todo."""
        # Verify category belongs to user
        category = await self.category_repository.find_by_id(
            user_id, todo_data.category_id
        )
        if not category:
            raise ValueError("Category not found or does not belong to user")
        
        # Create todo
        todo = Todo(
            id=Todo.generate_id(),
            title=todo_data.title,
            description=todo_data.description,
            date=todo_data.date,
            completed=False,
            completed_at=None,
            todo_type=todo_data.todo_type or TodoType.EVENT,
            priority=todo_data.priority,
            category_id=todo_data.category_id,
            user_id=user_id,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        
        await self.todo_repository.save(todo)
        
        return self._to_todo_response(todo, category)
    
    async def get_todos(
        self,
        user_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        category_id: Optional[str] = None,
        completed: Optional[bool] = None,
    ) -> List[TodoResponse]:
        """Get todos with filters."""
        if start_date and end_date:
            todos = await self.todo_repository.find_by_date_range(
                user_id, start_date, end_date
            )
        elif category_id:
            todos = await self.todo_repository.find_by_category(user_id, category_id)
        elif completed is not None:
            if completed:
                todos = await self.todo_repository.find_completed_for_user(user_id)
            else:
                todos = await self.todo_repository.find_incomplete_for_user(user_id)
        else:
            todos = await self.todo_repository.find_all_for_user(user_id)
        
        # Get categories for todos
        category_ids = list(set(todo.category_id for todo in todos))
        categories = []
        for cat_id in category_ids:
            cat = await self.category_repository.find_by_id(user_id, cat_id)
            if cat:
                categories.append(cat)
        
        category_map = {cat.id: cat for cat in categories}
        
        return [
            self._to_todo_response(todo, category_map.get(todo.category_id))
            for todo in todos
        ]
    
    async def get_todo_by_id(self, user_id: str, todo_id: str) -> TodoResponse:
        """Get a specific todo."""
        todo = await self.todo_repository.find_by_id(user_id, todo_id)
        if not todo:
            raise ValueError("Todo not found")
        
        category = await self.category_repository.find_by_id(user_id, todo.category_id)
        return self._to_todo_response(todo, category)
    
    async def update_todo(
        self, user_id: str, todo_id: str, update_data: TodoUpdate
    ) -> TodoResponse:
        """Update a todo."""
        todo = await self.todo_repository.find_by_id(user_id, todo_id)
        if not todo:
            raise ValueError("Todo not found")
        
        # Verify new category if provided
        if update_data.category_id:
            category = await self.category_repository.find_by_id(
                user_id, update_data.category_id
            )
            if not category:
                raise ValueError("Category not found or does not belong to user")
        
        # Update fields
        if update_data.title is not None:
            todo.title = update_data.title
        if update_data.description is not None:
            todo.description = update_data.description
        if update_data.date is not None:
            todo.date = update_data.date
        if update_data.priority is not None:
            todo.priority = update_data.priority
        if update_data.category_id is not None:
            todo.category_id = update_data.category_id
        if update_data.todo_type is not None:
            todo.todo_type = update_data.todo_type
        if update_data.completed is not None:
            todo.completed = update_data.completed
            todo.completed_at = datetime.utcnow() if update_data.completed else None
        
        todo.updated_at = datetime.utcnow()
        
        await self.todo_repository.save(todo)
        
        category = await self.category_repository.find_by_id(user_id, todo.category_id)
        return self._to_todo_response(todo, category)
    
    async def toggle_todo(self, user_id: str, todo_id: str) -> TodoResponse:
        """Toggle todo completion status."""
        updated = await self.todo_repository.update_completion_status(
            user_id, todo_id, None  # Toggle
        )
        if not updated:
            raise ValueError("Todo not found")
        
        category = await self.category_repository.find_by_id(
            user_id, updated.category_id
        )
        return self._to_todo_response(updated, category)
    
    async def delete_todo(self, user_id: str, todo_id: str) -> Dict[str, Any]:
        """Delete a todo."""
        deleted = await self.todo_repository.delete(user_id, todo_id)
        if not deleted:
            raise ValueError("Todo not found")
        
        return {"success": True, "deletedId": todo_id}
    
    async def delete_all_todos(self, user_id: str) -> Dict[str, Any]:
        """Delete all todos for a user."""
        count = await self.todo_repository.delete_all_for_user(user_id)
        return {"success": True, "deletedCount": count}
    
    async def get_stats(self, user_id: str) -> TodoStats:
        """Get todo statistics."""
        # Get basic stats
        stats = await self.todo_repository.get_stats_for_user(user_id)
        
        # Calculate recent completions (last 7 days)
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        completed_todos = await self.todo_repository.find_completed_for_user(user_id)
        recent_completions = sum(
            1 for todo in completed_todos
            if todo.completed_at and todo.completed_at >= seven_days_ago
        )
        
        # Calculate completion rate
        completion_rate = (
            round((stats["completed"] / stats["total"]) * 100)
            if stats["total"] > 0
            else 0
        )
        
        # Get todos by type
        all_todos = await self.todo_repository.find_all_for_user(user_id)
        event_todos = [t for t in all_todos if t.todo_type == TodoType.EVENT]
        task_todos = [t for t in all_todos if t.todo_type == TodoType.TASK]
        
        return TodoStats(
            total=stats["total"],
            completed=stats["completed"],
            incomplete=stats["incomplete"],
            completion_rate=completion_rate,
            recent_completions=recent_completions,
            event_stats={
                "total": len(event_todos),
                "completed": sum(1 for t in event_todos if t.completed),
                "incomplete": sum(1 for t in event_todos if not t.completed),
            },
            task_stats={
                "total": len(task_todos),
                "completed": sum(1 for t in task_todos if t.completed),
                "incomplete": sum(1 for t in task_todos if not t.completed),
            },
        )
    
    async def move_tasks(
        self, user_id: str, from_date: datetime, to_date: datetime
    ) -> List[TodoResponse]:
        """Move incomplete tasks from one date to another."""
        # Get incomplete tasks on the from_date
        todos = await self.todo_repository.find_by_date_range(
            user_id, from_date, from_date
        )
        
        tasks_to_move = [
            t for t in todos
            if t.todo_type == TodoType.TASK and not t.completed
        ]
        
        moved_tasks = []
        for task in tasks_to_move:
            task.date = to_date
            task.updated_at = datetime.utcnow()
            await self.todo_repository.save(task)
            
            category = await self.category_repository.find_by_id(
                user_id, task.category_id
            )
            moved_tasks.append(self._to_todo_response(task, category))
        
        return moved_tasks
    
    async def get_tasks_due_for_movement(
        self, user_id: str, before_date: datetime
    ) -> List[TodoResponse]:
        """Get incomplete tasks that are due for movement."""
        todos = await self.todo_repository.find_all_for_user(user_id)
        
        tasks_due = [
            t for t in todos
            if t.todo_type == TodoType.TASK
            and not t.completed
            and t.date < before_date
        ]
        
        # Get categories
        category_ids = list(set(t.category_id for t in tasks_due))
        categories = []
        for cat_id in category_ids:
            cat = await self.category_repository.find_by_id(user_id, cat_id)
            if cat:
                categories.append(cat)
        
        category_map = {cat.id: cat for cat in categories}
        
        return [
            self._to_todo_response(task, category_map.get(task.category_id))
            for task in tasks_due
        ]
    
    def _to_todo_response(
        self, todo: Todo, category: Optional[Category]
    ) -> TodoResponse:
        """Convert todo model to response."""
        return TodoResponse(
            id=todo.id,
            title=todo.title,
            description=todo.description,
            date=todo.date.isoformat(),
            completed=todo.completed,
            completed_at=todo.completed_at.isoformat() if todo.completed_at else None,
            priority=todo.priority,
            todo_type=todo.todo_type,
            category={
                "id": category.id,
                "name": category.name,
                "color": category.color,
                "icon": category.icon,
                "created_at": category.created_at.isoformat(),
                "order": category.order,
            } if category else None,
            created_at=todo.created_at.isoformat(),
            updated_at=todo.updated_at.isoformat(),
        )