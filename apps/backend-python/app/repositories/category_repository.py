"""
Category repository implementation.
"""
from typing import List, Optional

import redis.asyncio as redis

from app.models.category import Category
from .user_scoped_redis import UserScopedRedisRepository


class CategoryRepository(UserScopedRedisRepository[Category]):
    """Category repository with user-scoped Redis backend."""
    
    def __init__(self, redis_client: redis.Redis):
        super().__init__(redis_client)
    
    @property
    def entity_name(self) -> str:
        return "category"
    
    def model_class(self) -> type[Category]:
        return Category
    
    async def find_ordered_for_user(self, user_id: str) -> List[Category]:
        """Find categories ordered by order field for user."""
        categories = await self.find_all_for_user(user_id)
        return sorted(categories, key=lambda c: c.order)
    
    async def find_by_name_for_user(self, user_id: str, name: str) -> Optional[Category]:
        """Find category by name for user."""
        categories = await self.find_by_field_for_user(user_id, "name", name)
        return categories[0] if categories else None
    
    async def get_next_order_for_user(self, user_id: str) -> int:
        """Get next available order value for user."""
        categories = await self.find_all_for_user(user_id)
        if not categories:
            return 0
        
        max_order = max(category.order for category in categories)
        return max_order + 1
    
    async def reorder_categories_for_user(
        self, 
        user_id: str, 
        category_ids: List[str]
    ) -> List[Category]:
        """Reorder categories for user."""
        categories = []
        
        for i, category_id in enumerate(category_ids):
            category = await self.find_by_id_for_user(user_id, category_id)
            if category:
                category.order = i
                await self.save_for_user(user_id, category)
                categories.append(category)
        
        return categories
    
    async def save_for_user(self, user_id: str, category: Category) -> Category:
        """Save category with indexing."""
        # Ensure user_id is set
        category.user_id = user_id
        
        # Save the category entity
        result = await super().save_for_user(user_id, category)
        
        # Create indexes for efficient querying
        await self.create_user_index(user_id, category, "name", category.name)
        await self.create_user_index(user_id, category, "color", category.color)
        
        return result
    
    async def delete_for_user(self, user_id: str, category_id: str) -> bool:
        """Delete category and remove indexes."""
        # Get category to remove indexes
        category = await self.find_by_id_for_user(user_id, category_id)
        if not category:
            return False
        
        # Remove indexes
        await self.remove_user_index(user_id, category_id, "name", category.name)
        await self.remove_user_index(user_id, category_id, "color", category.color)
        
        # Delete the category entity
        return await super().delete_for_user(user_id, category_id)
    
    async def update_name_for_user(
        self, 
        user_id: str, 
        category_id: str, 
        new_name: str
    ) -> Optional[Category]:
        """Update category name with index maintenance."""
        category = await self.find_by_id_for_user(user_id, category_id)
        if not category:
            return None
        
        # Check if new name is already taken
        existing = await self.find_by_name_for_user(user_id, new_name)
        if existing and existing.id != category_id:
            return None
        
        # Update name and index
        old_name = category.name
        category.name = new_name
        
        await self.save_for_user(user_id, category)
        
        # Update name index
        await self.remove_user_index(user_id, category_id, "name", old_name)
        await self.create_user_index(user_id, category, "name", new_name)
        
        return category
    
    async def get_available_colors(self) -> List[str]:
        """Get predefined available colors for categories."""
        return [
            "#3B82F6",  # Blue
            "#EF4444",  # Red
            "#10B981",  # Green
            "#F59E0B",  # Amber
            "#8B5CF6",  # Purple
            "#06B6D4",  # Cyan
            "#84CC16",  # Lime
            "#F97316",  # Orange
            "#EC4899",  # Pink
            "#6B7280",  # Gray
            "#14B8A6",  # Teal
            "#A855F7",  # Violet
        ]