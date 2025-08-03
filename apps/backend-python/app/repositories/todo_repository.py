"""
Todo repository implementation.
"""
from datetime import datetime
from typing import List, Optional

import redis.asyncio as redis

from app.models.todo import Todo, TodoType
from .user_scoped_redis import UserScopedRedisRepository


class TodoRepository(UserScopedRedisRepository[Todo]):
    """Todo repository with user-scoped Redis backend."""
    
    def __init__(self, redis_client: redis.Redis):
        super().__init__(redis_client)
    
    @property
    def entity_name(self) -> str:
        return "todo"
    
    def model_class(self) -> type[Todo]:
        return Todo
    
    async def find_by_date_range_for_user(
        self, 
        user_id: str,
        start_date: datetime,
        end_date: datetime
    ) -> List[Todo]:
        """Find todos within date range for user."""
        todos = await self.find_all_for_user(user_id)
        
        return [
            todo for todo in todos
            if start_date <= todo.date <= end_date
        ]
    
    async def find_by_category_for_user(
        self, 
        user_id: str,
        category_id: str
    ) -> List[Todo]:
        """Find todos by category for user."""
        return await self.find_by_field_for_user(user_id, "category_id", category_id)
    
    async def find_completed_for_user(self, user_id: str) -> List[Todo]:
        """Find completed todos for user."""
        return await self.find_by_field_for_user(user_id, "completed", True)
    
    async def find_incomplete_for_user(self, user_id: str) -> List[Todo]:
        """Find incomplete todos for user."""
        return await self.find_by_field_for_user(user_id, "completed", False)
    
    async def find_tasks_for_user(self, user_id: str) -> List[Todo]:
        """Find task-type todos for user."""
        return await self.find_by_field_for_user(user_id, "todo_type", TodoType.TASK)
    
    async def find_events_for_user(self, user_id: str) -> List[Todo]:
        """Find event-type todos for user."""
        return await self.find_by_field_for_user(user_id, "todo_type", TodoType.EVENT)
    
    async def find_incomplete_tasks_before_date_for_user(
        self,
        user_id: str,
        date: datetime
    ) -> List[Todo]:
        """Find incomplete tasks before given date for user."""
        todos = await self.find_incomplete_for_user(user_id)
        
        return [
            todo for todo in todos
            if todo.todo_type == TodoType.TASK and todo.date < date
        ]
    
    async def save_for_user(self, user_id: str, todo: Todo) -> Todo:
        """Save todo with indexing."""
        # Save the todo entity
        result = await super().save_for_user(user_id, todo)
        
        # Create indexes for efficient querying
        await self.create_user_index(user_id, todo, "category_id", todo.category_id)
        await self.create_user_index(user_id, todo, "completed", str(todo.completed))
        await self.create_user_index(user_id, todo, "todo_type", todo.todo_type)
        
        return result
    
    async def delete_for_user(self, user_id: str, todo_id: str) -> bool:
        """Delete todo and remove indexes."""
        # Get todo to remove indexes
        todo = await self.find_by_id_for_user(user_id, todo_id)
        if not todo:
            return False
        
        # Remove indexes
        await self.remove_user_index(user_id, todo_id, "category_id", todo.category_id)
        await self.remove_user_index(user_id, todo_id, "completed", str(todo.completed))
        await self.remove_user_index(user_id, todo_id, "todo_type", todo.todo_type)
        
        # Delete the todo entity
        return await super().delete_for_user(user_id, todo_id)
    
    async def update_completion_status(
        self, 
        user_id: str, 
        todo_id: str, 
        completed: bool
    ) -> Optional[Todo]:
        """Update todo completion status with index maintenance."""
        todo = await self.find_by_id_for_user(user_id, todo_id)
        if not todo:
            return None
        
        # Update completion status and timestamp
        old_completed = todo.completed
        todo.completed = completed
        todo.completed_at = datetime.utcnow() if completed else None
        todo.updated_at = datetime.utcnow()
        
        # Save updated todo
        await self.save_for_user(user_id, todo)
        
        # Update completion index if status changed
        if old_completed != completed:
            await self.remove_user_index(user_id, todo_id, "completed", str(old_completed))
            await self.create_user_index(user_id, todo, "completed", str(completed))
        
        return todo
    
    async def move_tasks_to_date(
        self,
        user_id: str,
        from_date: datetime,
        to_date: datetime
    ) -> List[Todo]:
        """Move incomplete tasks from one date to another."""
        # Find incomplete tasks on the from_date
        todos = await self.find_incomplete_tasks_before_date_for_user(user_id, from_date)
        moved_todos = []
        
        for todo in todos:
            if todo.date.date() == from_date.date():
                # Update date while preserving time
                old_date = todo.date
                todo.date = datetime.combine(to_date.date(), old_date.time())
                todo.updated_at = datetime.utcnow()
                
                await self.save_for_user(user_id, todo)
                moved_todos.append(todo)
        
        return moved_todos
    
    async def get_stats_for_user(self, user_id: str) -> dict:
        """Get todo statistics for user."""
        todos = await self.find_all_for_user(user_id)
        
        total = len(todos)
        completed = len([t for t in todos if t.completed])
        incomplete = total - completed
        completion_rate = (completed / total * 100) if total > 0 else 0.0
        
        # Recent completions (last 7 days)
        week_ago = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        recent_completions = len([
            t for t in todos 
            if t.completed and t.completed_at and t.completed_at >= week_ago
        ])
        
        # Stats by type
        events = [t for t in todos if t.todo_type == TodoType.EVENT]
        tasks = [t for t in todos if t.todo_type == TodoType.TASK]
        
        by_type = {
            "event": {
                "total": len(events),
                "completed": len([t for t in events if t.completed]),
                "incomplete": len([t for t in events if not t.completed]),
            },
            "task": {
                "total": len(tasks),
                "completed": len([t for t in tasks if t.completed]),
                "incomplete": len([t for t in tasks if not t.completed]),
            },
        }
        
        return {
            "total": total,
            "completed": completed,
            "incomplete": incomplete,
            "completion_rate": completion_rate,
            "recent_completions": recent_completions,
            "by_type": by_type,
        }