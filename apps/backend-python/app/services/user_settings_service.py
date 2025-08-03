"""
User settings service for managing user preferences and categories.
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
import json

from app.models.user_settings import UserSettings
from app.models.category import Category
from app.repositories.user_settings_repository import UserSettingsRepository
from app.repositories.category_repository import CategoryRepository
from app.schemas.user_settings import UserSettingsUpdate
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse


class UserSettingsService:
    """Service for user settings and category management operations."""
    
    def __init__(
        self,
        user_settings_repository: UserSettingsRepository,
        category_repository: CategoryRepository,
    ):
        self.user_settings_repository = user_settings_repository
        self.category_repository = category_repository
    
    async def get_user_settings(self, user_id: str) -> UserSettings:
        """Get user settings or create default if not exists."""
        settings = await self.user_settings_repository.find_by_user_id(user_id)
        if not settings:
            settings = await self.user_settings_repository.create_default_settings(
                user_id
            )
        return settings
    
    async def update_user_settings(
        self, user_id: str, update_data: UserSettingsUpdate
    ) -> UserSettings:
        """Update user settings."""
        settings = await self.get_user_settings(user_id)
        
        # Update fields if provided
        for field, value in update_data.dict(exclude_unset=True).items():
            if hasattr(settings, field):
                setattr(settings, field, value)
        
        settings.updated_at = datetime.utcnow()
        
        await self.user_settings_repository.save(settings)
        return settings
    
    async def get_categories(self, user_id: str) -> List[CategoryResponse]:
        """Get user categories ordered by order field."""
        categories = await self.category_repository.find_ordered_for_user(user_id)
        
        return [
            CategoryResponse(
                id=cat.id,
                name=cat.name,
                color=cat.color,
                icon=cat.icon,
                order=cat.order,
                created_at=cat.created_at,
                is_default=cat.id in ["personal", "work", "life"],
            )
            for cat in categories
        ]
    
    async def create_category(
        self, user_id: str, category_data: CategoryCreate
    ) -> CategoryResponse:
        """Create a new category."""
        # Check if category name already exists
        existing = await self.category_repository.find_ordered_for_user(user_id)
        if any(cat.name == category_data.name for cat in existing):
            raise ValueError("Category name already exists")
        
        # Check category limit (max 10)
        if len(existing) >= 10:
            raise ValueError("Maximum number of categories reached (10)")
        
        # Get next order number
        next_order = await self.category_repository.get_next_order_for_user(user_id)
        
        # Create category
        category = Category(
            id=Category.generate_id(),
            name=category_data.name,
            color=category_data.color,
            icon=category_data.icon,
            order=next_order,
            user_id=user_id,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        
        await self.category_repository.save(category)
        
        return CategoryResponse(
            id=category.id,
            name=category.name,
            color=category.color,
            icon=category.icon,
            order=category.order,
            created_at=category.created_at,
            is_default=False,
        )
    
    async def update_category(
        self, user_id: str, category_id: str, update_data: CategoryUpdate
    ) -> CategoryResponse:
        """Update a category."""
        category = await self.category_repository.find_by_id(user_id, category_id)
        if not category:
            raise ValueError("Category not found")
        
        # Check if it's a default category
        if category_id in ["personal", "work", "life"]:
            # Default categories can only update color
            if update_data.name is not None:
                raise ValueError("Cannot change name of default category")
        
        # Check name uniqueness if updating name
        if update_data.name and update_data.name != category.name:
            existing = await self.category_repository.find_ordered_for_user(user_id)
            if any(cat.name == update_data.name for cat in existing):
                raise ValueError("Category name already exists")
        
        # Update fields
        if update_data.name is not None:
            category.name = update_data.name
        if update_data.color is not None:
            category.color = update_data.color
        if update_data.icon is not None:
            category.icon = update_data.icon
        
        category.updated_at = datetime.utcnow()
        
        await self.category_repository.save(category)
        
        return CategoryResponse(
            id=category.id,
            name=category.name,
            color=category.color,
            icon=category.icon,
            order=category.order,
            created_at=category.created_at,
            is_default=category_id in ["personal", "work", "life"],
        )
    
    async def delete_category(self, user_id: str, category_id: str) -> None:
        """Delete a category."""
        # Cannot delete default categories
        if category_id in ["personal", "work", "life"]:
            raise ValueError("Cannot delete default category")
        
        category = await self.category_repository.find_by_id(user_id, category_id)
        if not category:
            raise ValueError("Category not found")
        
        # TODO: Check if category is in use by any todos
        
        await self.category_repository.delete(user_id, category_id)
    
    async def reorder_categories(
        self, user_id: str, category_ids: List[str]
    ) -> List[CategoryResponse]:
        """Reorder categories."""
        # Get all categories
        categories = await self.category_repository.find_ordered_for_user(user_id)
        category_map = {cat.id: cat for cat in categories}
        
        # Validate all IDs exist
        for cat_id in category_ids:
            if cat_id not in category_map:
                raise ValueError(f"Category {cat_id} not found")
        
        # Update order
        for index, cat_id in enumerate(category_ids):
            category = category_map[cat_id]
            category.order = index
            category.updated_at = datetime.utcnow()
            await self.category_repository.save(category)
        
        # Return reordered categories
        return await self.get_categories(user_id)
    
    async def get_available_colors(self) -> List[str]:
        """Get list of available category colors."""
        return self.category_repository.get_available_colors()
    
    async def reset_settings(self, user_id: str) -> UserSettings:
        """Reset user settings to defaults."""
        # Delete current settings
        await self.user_settings_repository.delete(user_id)
        
        # Delete all categories
        await self.category_repository.delete_all_for_user(user_id)
        
        # Create new default settings
        return await self.user_settings_repository.create_default_settings(user_id)
    
    async def export_data(self, user_id: str) -> Dict[str, Any]:
        """Export user settings and categories."""
        settings = await self.get_user_settings(user_id)
        categories = await self.category_repository.find_ordered_for_user(user_id)
        
        return {
            "version": "1.0",
            "export_date": datetime.utcnow().isoformat(),
            "user_id": user_id,
            "settings": {
                "theme": settings.theme.value,
                "language": settings.language,
                "theme_color": settings.theme_color,
                "custom_color": settings.custom_color,
                "auto_move_todos": settings.auto_move_todos,
                "show_completed_todos": settings.show_completed_todos,
                "default_category_id": settings.default_category_id,
                "show_weekends": settings.show_weekends,
                "start_day_of_week": settings.start_day_of_week,
                "time_format": settings.time_format,
                "date_format": settings.date_format,
                "timezone": settings.timezone,
                "reminder_enabled": settings.reminder_enabled,
                "reminder_time": settings.reminder_time,
                "old_todo_display_limit": settings.old_todo_display_limit,
            },
            "categories": [
                {
                    "id": cat.id,
                    "name": cat.name,
                    "color": cat.color,
                    "icon": cat.icon,
                    "order": cat.order,
                }
                for cat in categories
            ],
        }
    
    async def import_data(self, user_id: str, import_data: Dict[str, Any]) -> None:
        """Import user settings and categories."""
        if "settings" not in import_data:
            raise ValueError("Invalid import data: missing settings")
        
        # Update settings
        settings_data = import_data["settings"]
        settings = await self.get_user_settings(user_id)
        
        for field, value in settings_data.items():
            if hasattr(settings, field):
                setattr(settings, field, value)
        
        settings.updated_at = datetime.utcnow()
        await self.user_settings_repository.save(settings)
        
        # Update categories if provided
        if "categories" in import_data:
            # Delete existing categories (except defaults)
            existing = await self.category_repository.find_ordered_for_user(user_id)
            for cat in existing:
                if cat.id not in ["personal", "work", "life"]:
                    await self.category_repository.delete(user_id, cat.id)
            
            # Import new categories
            for cat_data in import_data["categories"]:
                if cat_data["id"] in ["personal", "work", "life"]:
                    # Update default category
                    category = await self.category_repository.find_by_id(
                        user_id, cat_data["id"]
                    )
                    if category:
                        category.color = cat_data.get("color", category.color)
                        category.order = cat_data.get("order", category.order)
                        category.updated_at = datetime.utcnow()
                        await self.category_repository.save(category)
                else:
                    # Create custom category
                    category = Category(
                        id=Category.generate_id(),
                        name=cat_data["name"],
                        color=cat_data["color"],
                        icon=cat_data.get("icon"),
                        order=cat_data.get("order", 0),
                        user_id=user_id,
                        created_at=datetime.utcnow(),
                        updated_at=datetime.utcnow(),
                    )
                    await self.category_repository.save(category)