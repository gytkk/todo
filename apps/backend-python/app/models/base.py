"""
Base models and common types.
"""
from datetime import datetime
from typing import Optional
from uuid import uuid4

from pydantic import BaseModel, Field


class TimestampedModel(BaseModel):
    """Base model with timestamp fields."""
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class BaseEntityModel(TimestampedModel):
    """Base entity model with ID and timestamps."""
    
    id: str = Field(default_factory=lambda: str(uuid4()))
    

class PaginationParams(BaseModel):
    """Pagination parameters."""
    
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=20, ge=1, le=100)
    
    @property
    def offset(self) -> int:
        """Calculate offset from page and limit."""
        return (self.page - 1) * self.limit


class PaginatedResponse(BaseModel):
    """Paginated response wrapper."""
    
    items: list
    total: int
    page: int
    limit: int
    pages: int
    
    @classmethod
    def create(cls, items: list, total: int, page: int, limit: int):
        """Create paginated response."""
        pages = (total + limit - 1) // limit  # Ceiling division
        return cls(
            items=items,
            total=total,
            page=page,
            limit=limit,
            pages=pages,
        )