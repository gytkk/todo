"""
User settings domain models.
"""
from enum import Enum
from typing import Dict, Optional

from pydantic import BaseModel, Field, validator


class ThemeType(str, Enum):
    """Theme type enumeration."""
    
    LIGHT = "light"
    DARK = "dark"
    SYSTEM = "system"


class DateFormat(str, Enum):
    """Date format enumeration."""
    
    YYYY_MM_DD = "YYYY-MM-DD"
    MM_DD_YYYY = "MM/DD/YYYY"
    DD_MM_YYYY = "DD/MM/YYYY"


class TimeFormat(str, Enum):
    """Time format enumeration."""
    
    TWELVE_HOUR = "12h"
    TWENTY_FOUR_HOUR = "24h"


class WeekStart(str, Enum):
    """Week start day enumeration."""
    
    SUNDAY = "sunday"
    MONDAY = "monday"
    SATURDAY = "saturday"


class DefaultView(str, Enum):
    """Default calendar view enumeration."""
    
    MONTH = "month"
    WEEK = "week"
    DAY = "day"


class CompletedTodoDisplay(str, Enum):
    """Completed todo display options."""
    
    ALL = "all"
    YESTERDAY = "yesterday"
    NONE = "none"


class BackupInterval(str, Enum):
    """Backup interval options."""
    
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"


class NotificationSettings(BaseModel):
    """Notification settings model."""
    
    enabled: bool = True
    daily_reminder: bool = False
    weekly_report: bool = False


class SaturationLevel(BaseModel):
    """Saturation adjustment level."""
    
    days: int = Field(..., ge=1)
    opacity: float = Field(..., ge=0.0, le=1.0)


class SaturationAdjustment(BaseModel):
    """Saturation adjustment settings."""
    
    enabled: bool = True
    levels: list[SaturationLevel] = Field(default_factory=list)


class UserSettings(BaseModel):
    """User settings model."""
    
    user_id: str
    
    # Category settings
    category_filter: Dict[str, bool] = Field(default_factory=dict)
    
    # Appearance settings
    theme: ThemeType = ThemeType.LIGHT
    language: str = "ko"
    theme_color: str = "#3B82F6"
    custom_color: str = "#3B82F6"
    default_view: DefaultView = DefaultView.MONTH
    
    # Calendar settings
    date_format: DateFormat = DateFormat.YYYY_MM_DD
    time_format: TimeFormat = TimeFormat.TWENTY_FOUR_HOUR
    timezone: str = "Asia/Seoul"
    week_start: WeekStart = WeekStart.SUNDAY
    
    # Todo settings
    auto_move_todos: bool = True
    show_task_move_notifications: bool = True
    completed_todo_display: CompletedTodoDisplay = CompletedTodoDisplay.YESTERDAY
    old_todo_display_limit: int = Field(default=14, ge=1, le=365)
    saturation_adjustment: SaturationAdjustment = Field(default_factory=SaturationAdjustment)
    
    # Additional settings
    show_weekends: bool = True
    notifications: NotificationSettings = Field(default_factory=NotificationSettings)
    auto_backup: bool = False
    backup_interval: BackupInterval = BackupInterval.WEEKLY
    
    @validator('theme_color', 'custom_color')
    def validate_color(cls, v):
        if not v.startswith('#') or len(v) != 7:
            raise ValueError('Color must be a valid hex color (e.g., #3B82F6)')
        return v
    
    @validator('language')
    def validate_language(cls, v):
        allowed_languages = ['ko', 'en']
        if v not in allowed_languages:
            raise ValueError(f'Language must be one of: {allowed_languages}')
        return v


class UserSettingsUpdate(BaseModel):
    """User settings update model."""
    
    # Category settings
    category_filter: Optional[Dict[str, bool]] = None
    
    # Appearance settings
    theme: Optional[ThemeType] = None
    language: Optional[str] = None
    theme_color: Optional[str] = None
    custom_color: Optional[str] = None
    default_view: Optional[DefaultView] = None
    
    # Calendar settings
    date_format: Optional[DateFormat] = None
    time_format: Optional[TimeFormat] = None
    timezone: Optional[str] = None
    week_start: Optional[WeekStart] = None
    
    # Todo settings
    auto_move_todos: Optional[bool] = None
    show_task_move_notifications: Optional[bool] = None
    completed_todo_display: Optional[CompletedTodoDisplay] = None
    old_todo_display_limit: Optional[int] = Field(None, ge=1, le=365)
    saturation_adjustment: Optional[SaturationAdjustment] = None
    
    # Additional settings
    show_weekends: Optional[bool] = None
    notifications: Optional[NotificationSettings] = None
    auto_backup: Optional[bool] = None
    backup_interval: Optional[BackupInterval] = None
    
    @validator('theme_color', 'custom_color')
    def validate_color(cls, v):
        if v is not None and (not v.startswith('#') or len(v) != 7):
            raise ValueError('Color must be a valid hex color (e.g., #3B82F6)')
        return v
    
    @validator('language')
    def validate_language(cls, v):
        if v is not None:
            allowed_languages = ['ko', 'en']
            if v not in allowed_languages:
                raise ValueError(f'Language must be one of: {allowed_languages}')
        return v


class UserSettingsResponse(BaseModel):
    """User settings response model."""
    
    settings: UserSettings


class ExportDataResponse(BaseModel):
    """Export data response model."""
    
    data: dict