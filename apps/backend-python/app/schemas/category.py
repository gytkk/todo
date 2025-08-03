"""
Category-related request/response schemas.
"""
from typing import Optional

from pydantic import BaseModel, Field

from app.models.category import CategoryResponse


class CategoryCreateRequest(BaseModel):
    """Create category request schema."""
    
    name: str = Field(..., min_length=1, max_length=50)
    color: str = Field(..., regex=r'^#[0-9A-Fa-f]{6}$')
    icon: Optional[str] = Field(None, max_length=50)


class CategoryUpdateRequest(BaseModel):
    """Update category request schema."""
    
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    color: Optional[str] = Field(None, regex=r'^#[0-9A-Fa-f]{6}$')
    icon: Optional[str] = Field(None, max_length=50)


class CategoryCreateResponse(BaseModel):
    """Create category response schema."""
    
    category: CategoryResponse


class CategoryUpdateResponse(BaseModel):
    """Update category response schema."""
    
    category: CategoryResponse


class CategoryListResponse(BaseModel):
    """Category list response schema."""
    
    categories: list[CategoryResponse]


class CategoryDeleteResponse(BaseModel):
    """Delete category response schema."""
    
    success: bool = True
    deleted_id: str
    message: str = "Category deleted successfully"


class ReorderCategoriesRequest(BaseModel):
    """Reorder categories request schema."""
    
    category_ids: list[str] = Field(..., min_items=1)


class ReorderCategoriesResponse(BaseModel):
    """Reorder categories response schema."""
    
    categories: list[CategoryResponse]
    message: str = "Categories reordered successfully"


class AvailableColorsResponse(BaseModel):
    """Available colors response schema."""
    
    colors: list[str]