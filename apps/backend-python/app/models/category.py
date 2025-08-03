"""
Category domain models.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator

from .base import BaseEntityModel


class Category(BaseEntityModel):
    """Todo category entity model."""
    
    name: str = Field(..., min_length=1, max_length=50)
    color: str = Field(..., pattern=r'^#[0-9A-Fa-f]{6}$')
    icon: Optional[str] = Field(None, max_length=50)
    order: int = Field(default=0, ge=0)
    user_id: str


class CategoryCreate(BaseModel):
    """Category creation model."""
    
    name: str = Field(..., min_length=1, max_length=50)
    color: str = Field(..., pattern=r'^#[0-9A-Fa-f]{6}$')
    icon: Optional[str] = Field(None, max_length=50)
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        if not v or not v.strip():
            raise ValueError('Category name cannot be empty')
        return v.strip()


class CategoryUpdate(BaseModel):
    """Category update model."""
    
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    icon: Optional[str] = Field(None, max_length=50)
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        if v is not None and (not v or not v.strip()):
            raise ValueError('Category name cannot be empty')
        return v.strip() if v else v


class CategoryResponse(BaseModel):
    """Category response model."""
    
    id: str
    name: str
    color: str
    icon: Optional[str]
    order: int
    created_at: datetime


class ReorderCategoriesRequest(BaseModel):
    """Reorder categories request."""
    
    category_ids: list[str] = Field(..., min_items=1)