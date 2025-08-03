"""
User settings-related request/response schemas.
"""
from app.models.user_settings import (
    UserSettingsUpdate,
    UserSettingsResponse,
    ExportDataResponse
)


class UserSettingsRequest(UserSettingsUpdate):
    """User settings update request schema."""
    pass  # Inherit from model


class ImportDataRequest(dict):
    """Import data request schema."""
    pass  # Accept any dict structure for import


class ImportDataResponse(BaseModel):
    """Import data response schema."""
    
    settings: UserSettings
    message: str = "Data imported successfully"


class ResetSettingsResponse(BaseModel):
    """Reset settings response schema."""
    
    settings: UserSettings
    message: str = "Settings reset to defaults"