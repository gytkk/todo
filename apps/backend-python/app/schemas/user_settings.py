"""
User settings-related request/response schemas.
"""
from pydantic import BaseModel

from app.models.user_settings import (
    UserSettings,
    UserSettingsUpdate,
    UserSettingsResponse,
    ExportDataResponse
)


class UserSettingsRequest(UserSettingsUpdate):
    """User settings update request schema."""
    pass  # Inherit from model


class ImportDataRequest(BaseModel):
    """Import data request schema."""
    
    settings: dict = {}
    categories: list = []
    todos: list = []


class ImportDataResponse(BaseModel):
    """Import data response schema."""
    
    settings: UserSettings
    message: str = "Data imported successfully"


class ResetSettingsResponse(BaseModel):
    """Reset settings response schema."""
    
    settings: UserSettings
    message: str = "Settings reset to defaults"