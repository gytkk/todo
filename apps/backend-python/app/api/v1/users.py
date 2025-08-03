"""
Users API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status

from app.schemas.user import (
    UserProfileResponse,
    UpdateUserProfileRequest, 
    ChangePasswordRequest,
    ChangePasswordResponse,
)
from app.services.user_service import UserService
from app.core.dependencies import get_user_service, get_current_user_id

router = APIRouter()


@router.get("/me", response_model=UserProfileResponse)
async def get_current_user(
    current_user_id: str = Depends(get_current_user_id),
    user_service: UserService = Depends(get_user_service),
) -> UserProfileResponse:
    """Get current user profile."""
    try:
        user_profile = await user_service.get_user_profile(current_user_id)
        return UserProfileResponse(user=user_profile)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.put("/me", response_model=UserProfileResponse)
async def update_current_user(
    update_data: UpdateUserProfileRequest,
    current_user_id: str = Depends(get_current_user_id),
    user_service: UserService = Depends(get_user_service),
) -> UserProfileResponse:
    """Update current user profile."""
    try:
        from app.schemas.user import UserUpdate
        user_update = UserUpdate(name=update_data.name)
        user_profile = await user_service.update_profile(current_user_id, user_update)
        return UserProfileResponse(user=user_profile)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.put("/me/password", response_model=ChangePasswordResponse)
async def change_password(
    password_data: ChangePasswordRequest,
    current_user_id: str = Depends(get_current_user_id),
    user_service: UserService = Depends(get_user_service),
) -> ChangePasswordResponse:
    """Change user password."""
    try:
        result = await user_service.change_password(current_user_id, password_data)
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_current_user(
    current_user_id: str = Depends(get_current_user_id),
    user_service: UserService = Depends(get_user_service),
) -> None:
    """Delete current user account."""
    try:
        await user_service.delete_account(current_user_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )