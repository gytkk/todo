"""
User Settings API endpoints.
"""
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status

from app.schemas.user_settings import (
    UserSettingsRequest,
    ImportDataRequest,
    ImportDataResponse,
)
from app.schemas.category import (
    CategoryCreateRequest,
    CategoryUpdateRequest,
    CategoryCreateResponse,
    CategoryUpdateResponse,
    CategoryListResponse,
    CategoryDeleteResponse,
    ReorderCategoriesRequest,
    ReorderCategoriesResponse,
    AvailableColorsResponse,
)
from app.models.user_settings import UserSettings
from app.services.user_settings_service import UserSettingsService
from app.core.dependencies import get_user_settings_service, get_current_user_id

router = APIRouter()


@router.get("", response_model=UserSettings)
async def get_user_settings(
    current_user_id: str = Depends(get_current_user_id),
    user_settings_service: UserSettingsService = Depends(get_user_settings_service),
) -> UserSettings:
    """Get user settings."""
    try:
        return await user_settings_service.get_settings(current_user_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.put("", response_model=UserSettings)
async def update_user_settings(
    settings_data: UserSettingsRequest,
    current_user_id: str = Depends(get_current_user_id),
    user_settings_service: UserSettingsService = Depends(get_user_settings_service),
) -> UserSettings:
    """Update user settings."""
    try:
        return await user_settings_service.update_settings(current_user_id, settings_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get("/categories", response_model=CategoryListResponse)
async def get_categories(
    current_user_id: str = Depends(get_current_user_id),
    user_settings_service: UserSettingsService = Depends(get_user_settings_service),
) -> CategoryListResponse:
    """Get user categories."""
    try:
        categories = await user_settings_service.get_categories(current_user_id)
        return CategoryListResponse(categories=categories)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/categories", response_model=CategoryCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    category_data: CategoryCreateRequest,
    current_user_id: str = Depends(get_current_user_id),
    user_settings_service: UserSettingsService = Depends(get_user_settings_service),
) -> CategoryCreateResponse:
    """Create a new category."""
    try:
        from app.schemas.category import CategoryCreate
        category_create = CategoryCreate(
            name=category_data.name,
            color=category_data.color,
            icon=category_data.icon,
        )
        category = await user_settings_service.create_category(current_user_id, category_create)
        return CategoryCreateResponse(category=category)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get("/categories/available-colors", response_model=AvailableColorsResponse)
async def get_available_colors(
    user_settings_service: UserSettingsService = Depends(get_user_settings_service),
) -> AvailableColorsResponse:
    """Get available colors for categories."""
    try:
        colors = await user_settings_service.get_available_colors()
        return AvailableColorsResponse(colors=colors)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.put("/categories/reorder", response_model=ReorderCategoriesResponse)
async def reorder_categories(
    reorder_data: ReorderCategoriesRequest,
    current_user_id: str = Depends(get_current_user_id),
    user_settings_service: UserSettingsService = Depends(get_user_settings_service),
) -> ReorderCategoriesResponse:
    """Reorder categories."""
    try:
        categories = await user_settings_service.reorder_categories(current_user_id, reorder_data.category_ids)
        return ReorderCategoriesResponse(
            categories=categories,
            message="Categories reordered successfully"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.put("/categories/{category_id}", response_model=CategoryUpdateResponse)
async def update_category(
    category_id: str,
    category_data: CategoryUpdateRequest,
    current_user_id: str = Depends(get_current_user_id),
    user_settings_service: UserSettingsService = Depends(get_user_settings_service),
) -> CategoryUpdateResponse:
    """Update category by ID."""
    try:
        from app.schemas.category import CategoryUpdate
        category_update = CategoryUpdate(
            name=category_data.name,
            color=category_data.color,
            icon=category_data.icon,
        )
        category = await user_settings_service.update_category(current_user_id, category_id, category_update)
        return CategoryUpdateResponse(category=category)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.delete("/categories/{category_id}", response_model=CategoryDeleteResponse)
async def delete_category(
    category_id: str,
    current_user_id: str = Depends(get_current_user_id),
    user_settings_service: UserSettingsService = Depends(get_user_settings_service),
) -> CategoryDeleteResponse:
    """Delete category by ID."""
    try:
        await user_settings_service.delete_category(current_user_id, category_id)
        return CategoryDeleteResponse(deleted_id=category_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/reset", response_model=Dict[str, Any])
async def reset_settings(
    current_user_id: str = Depends(get_current_user_id),
    user_settings_service: UserSettingsService = Depends(get_user_settings_service),
) -> Dict[str, Any]:
    """Reset user settings to defaults."""
    try:
        settings = await user_settings_service.reset_settings(current_user_id)
        return {
            "user_id": settings.user_id,
            "theme": settings.theme.value,
            "language": settings.language,
            "reset": True,
            "message": "Settings reset to defaults"
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get("/export")
async def export_data(
    current_user_id: str = Depends(get_current_user_id),
    user_settings_service: UserSettingsService = Depends(get_user_settings_service),
) -> Dict[str, Any]:
    """Export user data."""
    try:
        return await user_settings_service.export_data(current_user_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/import", response_model=ImportDataResponse)
async def import_data(
    import_data: ImportDataRequest,
    current_user_id: str = Depends(get_current_user_id),
    user_settings_service: UserSettingsService = Depends(get_user_settings_service),
) -> ImportDataResponse:
    """Import user data."""
    try:
        settings = await user_settings_service.import_data(current_user_id, import_data)
        return ImportDataResponse(
            settings=settings,
            message="Data imported successfully"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get("/category-filter")
async def get_category_filter(
    current_user_id: str = Depends(get_current_user_id),
    user_settings_service: UserSettingsService = Depends(get_user_settings_service),
) -> Dict[str, Any]:
    """Get category filter settings."""
    try:
        return await user_settings_service.get_category_filter(current_user_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.put("/categories/{category_id}/filter", response_model=CategoryUpdateResponse)
async def update_category_filter(
    category_id: str,
    filter_data: Dict[str, Any],
    current_user_id: str = Depends(get_current_user_id),
    user_settings_service: UserSettingsService = Depends(get_user_settings_service),
) -> CategoryUpdateResponse:
    """Update category filter settings."""
    try:
        category = await user_settings_service.update_category_filter(current_user_id, category_id, filter_data)
        return CategoryUpdateResponse(category=category)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )