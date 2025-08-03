"""
Authentication API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.schemas.auth import (
    AuthResponse,
    LoginRequest, 
    RegisterRequest,
    RefreshTokenRequest,
)
from app.services.auth_service import AuthService
from app.core.dependencies import get_auth_service, get_current_user_id

router = APIRouter()
security = HTTPBearer()


@router.post(
    "/register", 
    response_model=AuthResponse, 
    status_code=status.HTTP_201_CREATED,
    summary="사용자 회원가입",
    description="""
    새로운 사용자를 등록합니다.
    
    - **email**: 유니크한 이메일 주소 (필수)
    - **name**: 사용자 이름 (필수)
    - **password**: 비밀번호 (최소 8자, 영문+숫자+특수문자 포함)
    
    성공시 액세스 토큰과 리프레시 토큰을 반환합니다.
    """,
    responses={
        201: {
            "description": "회원가입 성공",
            "content": {
                "application/json": {
                    "example": {
                        "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
                        "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
                        "token_type": "bearer",
                        "user": {
                            "id": "550e8400-e29b-41d4-a716-446655440000",
                            "email": "user@example.com",
                            "name": "홍길동"
                        },
                        "user_settings": {
                            "user_id": "550e8400-e29b-41d4-a716-446655440000",
                            "theme": "light",
                            "language": "ko"
                        }
                    }
                }
            }
        },
        400: {
            "description": "잘못된 요청 (이메일 중복, 비밀번호 규칙 위반 등)",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "User with this email already exists"
                    }
                }
            }
        }
    }
)
async def register(
    register_data: RegisterRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> AuthResponse:
    """새로운 사용자를 등록합니다."""
    try:
        return await auth_service.register(register_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post(
    "/login", 
    response_model=AuthResponse,
    summary="사용자 로그인",
    description="""
    등록된 사용자의 로그인을 처리합니다.
    
    - **email**: 등록된 이메일 주소
    - **password**: 비밀번호
    - **remember_me**: 로그인 유지 여부 (선택사항, 기본값: false)
    
    성공시 새로운 액세스 토큰과 리프레시 토큰을 발급합니다.
    """,
    responses={
        200: {
            "description": "로그인 성공",
            "content": {
                "application/json": {
                    "example": {
                        "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
                        "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
                        "token_type": "bearer",
                        "user": {
                            "id": "550e8400-e29b-41d4-a716-446655440000",
                            "email": "user@example.com",
                            "name": "홍길동"
                        }
                    }
                }
            }
        },
        401: {
            "description": "인증 실패 (잘못된 이메일 또는 비밀번호)",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "Invalid email or password"
                    }
                }
            }
        }
    }
)
async def login(
    login_data: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> AuthResponse:
    """등록된 사용자의 로그인을 처리합니다."""
    try:
        return await auth_service.login(login_data, login_data.remember_me or False)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )


@router.post(
    "/refresh", 
    response_model=AuthResponse,
    summary="액세스 토큰 갱신",
    description="""
    리프레시 토큰을 사용하여 새로운 액세스 토큰을 발급받습니다.
    
    - **refresh_token**: 유효한 리프레시 토큰
    
    성공시 새로운 액세스 토큰과 리프레시 토큰을 발급합니다.
    """,
    responses={
        200: {
            "description": "토큰 갱신 성공",
            "content": {
                "application/json": {
                    "example": {
                        "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
                        "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
                        "token_type": "bearer",
                        "user": {
                            "id": "550e8400-e29b-41d4-a716-446655440000",
                            "email": "user@example.com",
                            "name": "홍길동"
                        }
                    }
                }
            }
        },
        401: {
            "description": "유효하지 않은 리프레시 토큰",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "Invalid refresh token"
                    }
                }
            }
        }
    }
)
async def refresh_token(
    refresh_data: RefreshTokenRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> AuthResponse:
    """리프레시 토큰을 사용하여 새로운 액세스 토큰을 발급받습니다."""
    try:
        return await auth_service.refresh_token(refresh_data.refresh_token)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )


@router.post(
    "/logout", 
    status_code=status.HTTP_204_NO_CONTENT,
    summary="사용자 로그아웃",
    description="""
    현재 로그인된 사용자를 로그아웃합니다.
    
    JWT Bearer 토큰이 필요합니다. 로그아웃 후 현재 토큰은 무효화됩니다.
    """,
    responses={
        204: {
            "description": "로그아웃 성공 (응답 본문 없음)"
        },
        401: {
            "description": "인증되지 않은 사용자",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "Could not validate credentials"
                    }
                }
            }
        },
        400: {
            "description": "로그아웃 처리 중 오류",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "Failed to logout user"
                    }
                }
            }
        }
    }
)
async def logout(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user_id: str = Depends(get_current_user_id),
    auth_service: AuthService = Depends(get_auth_service),
) -> None:
    """현재 로그인된 사용자를 로그아웃합니다."""
    try:
        access_token = credentials.credentials
        await auth_service.logout(current_user_id, access_token)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )