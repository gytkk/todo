"""
FastAPI application entry point.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.openapi.utils import get_openapi

from app.core.config import settings

# OpenAPI metadata
tags_metadata = [
    {
        "name": "auth",
        "description": "인증 및 사용자 관리 엔드포인트입니다. 회원가입, 로그인, 토큰 갱신 등의 기능을 제공합니다.",
    },
    {
        "name": "users",
        "description": "사용자 프로필 관리 엔드포인트입니다. 사용자 정보 조회, 수정, 비밀번호 변경 등의 기능을 제공합니다.",
    },
    {
        "name": "todos",
        "description": "할 일 관리 엔드포인트입니다. Todo CRUD 작업, 통계 조회, Task 이동 등의 기능을 제공합니다.",
    },
    {
        "name": "user-settings",
        "description": "사용자 설정 및 카테고리 관리 엔드포인트입니다. 설정 변경, 카테고리 관리, 데이터 import/export 등의 기능을 제공합니다.",
    },
]

# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="""
## Calendar Todo Application API

한국어 달력 기반 Todo 애플리케이션의 백엔드 API입니다.

### 주요 기능

* **사용자 인증**: JWT 기반 회원가입, 로그인, 토큰 관리
* **Todo 관리**: Task와 Event 타입 지원, 카테고리별 분류, 완료 상태 관리
* **사용자 설정**: 테마, 언어, 카테고리 등 개인화 설정
* **통계**: Todo 완료율 및 다양한 통계 정보 제공

### 기술 스택

* **FastAPI**: 고성능 Python 웹 프레임워크
* **Redis**: 데이터 저장 및 캐싱
* **JWT**: 안전한 사용자 인증
* **Pydantic**: 데이터 검증 및 직렬화

### 인증

대부분의 API 엔드포인트는 JWT Bearer 토큰 인증이 필요합니다.
`Authorization: Bearer <token>` 헤더를 포함해주세요.
    """,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    openapi_tags=tags_metadata,
    contact={
        "name": "Calendar Todo API Support",
        "email": "support@calendartodo.com",
    },
    license_info={
        "name": "MIT License",
        "url": "https://opensource.org/licenses/MIT",
    },
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/")
async def root() -> dict:
    """Root endpoint."""
    return {
        "message": "Calendar Todo API",
        "version": settings.app_version,
        "docs": "/docs",
    }


@app.get("/health")
async def health_check() -> dict:
    """Health check endpoint."""
    return {
        "status": "healthy",
        "app": settings.app_name,
        "version": settings.app_version,
    }


# Error handlers
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler."""
    if settings.debug:
        import traceback
        return JSONResponse(
            status_code=500,
            content={
                "detail": str(exc),
                "traceback": traceback.format_exc(),
            }
        )
    else:
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"}
        )


# API routers
from app.api.v1 import auth, users, todos, user_settings
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(todos.router, prefix="/todos", tags=["todos"])
app.include_router(user_settings.router, prefix="/user-settings", tags=["user-settings"])


def custom_openapi():
    """Custom OpenAPI schema with security schemes."""
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    
    # Add security scheme
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "JWT Bearer 토큰을 입력하세요. 예: 'your_jwt_token_here'"
        }
    }
    
    # Add servers information
    openapi_schema["servers"] = [
        {
            "url": "http://localhost:8000",
            "description": "개발 서버"
        },
        {
            "url": "https://api.calendartodo.com",
            "description": "프로덕션 서버"
        }
    ]
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi