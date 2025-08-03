# NestJS → Python FastAPI 마이그레이션 계획

## 개요
현재 NestJS 기반 백엔드를 Python FastAPI로 마이그레이션하는 체계적인 계획입니다. 기존의 잘 작성된 테스트를 활용하여 Test-Driven Migration 방식으로 진행합니다.

## Phase 1: 환경 설정 및 프로젝트 구조 (1-2일)

### 1.1 FastAPI 프로젝트 초기화
```
apps/backend-python/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── core/
│   │   ├── config.py
│   │   ├── security.py
│   │   └── dependencies.py
│   ├── api/
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── todos.py
│   │   │   ├── users.py
│   │   │   └── user_settings.py
│   ├── models/
│   ├── schemas/
│   ├── services/
│   ├── repositories/
│   └── tests/
├── requirements.txt
├── pyproject.toml
└── Dockerfile
```

### 1.2 의존성 매핑
- **NestJS → FastAPI**
  - `@nestjs/common` → `fastapi`
  - `@nestjs/jwt` → `python-jose[cryptography]`
  - `bcrypt` → `passlib[bcrypt]`
  - `class-validator` → `pydantic`
  - `ioredis` → `redis-py`
  - `jest` → `pytest`

### 1.3 개발 환경 통합
- Turborepo에 `backend-python` 추가
- Docker Compose 설정 업데이트
- 포트 변경 (3001 → 8001)

## Phase 2: 테스트 프레임워크 마이그레이션 (2-3일)

### 2.1 Jest → Pytest 변환 도구 개발
```python
# test_migration_tool.py
def convert_jest_to_pytest(jest_file_path):
    """Jest 테스트를 Pytest로 자동 변환"""
    # describe → class Test*
    # it/test → def test_*
    # expect().toBe() → assert ... == ...
    # Mock 설정 변환
```

### 2.2 테스트 케이스 마이그레이션 우선순위
1. **인증 관련 테스트** (auth.service.spec.ts → test_auth_service.py)
2. **사용자 관리 테스트** (user.service.spec.ts → test_user_service.py)
3. **할일 관리 테스트** (todo.service.spec.ts → test_todo_service.py)
4. **설정 관리 테스트** (user-settings.service.spec.ts → test_user_settings_service.py)
5. **Redis Repository 테스트**
6. **컨트롤러 테스트** (integration tests)

### 2.3 테스트 데이터 및 Mock 변환
```python
# test_fixtures.py
@pytest.fixture
def mock_user():
    return User(
        id="test-user-id",
        email="test@example.com",
        name="John Doe",
        # ... NestJS 테스트의 mockUser 데이터
    )
```

## Phase 3: 핵심 모델 및 스키마 (2-3일)

### 3.1 Pydantic 모델 생성
```python
# models/user.py
class User(BaseModel):
    id: str
    email: EmailStr
    name: Optional[str]
    password_hash: str
    email_verified: bool = False
    is_active: bool = True
    created_at: datetime
    updated_at: datetime

# schemas/auth.py
class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    remember_me: Optional[bool] = False

class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    user: UserProfile
    user_settings: UserSettingsData
```

### 3.2 Redis Repository 패턴 구현
```python
# repositories/base_redis.py
class BaseRedisRepository:
    def __init__(self, redis_client: Redis):
        self.redis = redis_client
    
    async def save(self, entity: BaseModel) -> bool:
        # NestJS BaseRedisRepository 로직 이식
    
    async def find_by_id(self, id: str) -> Optional[BaseModel]:
        # 기존 로직 이식
```

## Phase 4: TDD 방식 서비스 구현 (4-5일)

### 4.1 인증 서비스 (1-2일)
```python
# services/auth_service.py
class AuthService:
    async def register(self, register_data: RegisterRequest) -> AuthResponse:
        # 실패하는 테스트부터 시작
        # 테스트 통과할 때까지 구현
        pass
    
    async def login(self, user: User, remember_me: bool) -> AuthResponse:
        pass
    
    async def refresh_token(self, refresh_token: str) -> AuthResponse:
        pass
```

### 4.2 사용자 관리 서비스 (1일)
### 4.3 할일 관리 서비스 (1-2일)
### 4.4 설정 관리 서비스 (1일)

## Phase 5: API 엔드포인트 구현 (3-4일)

### 5.1 FastAPI 라우터 구현
```python
# api/v1/auth.py
@router.post("/register", response_model=AuthResponse)
async def register(register_data: RegisterRequest):
    # OpenAPI 스펙 호환
    # NestJS 컨트롤러 테스트 기반 구현
    pass
```

### 5.2 미들웨어 및 의존성 주입
```python
# core/dependencies.py
async def get_current_user(token: str = Depends(oauth2_scheme)):
    # JWT 검증 로직
    pass

async def get_redis_client():
    # Redis 연결 관리
    pass
```

## Phase 6: 통합 테스트 및 E2E 테스트 (2-3일)

### 6.1 NestJS E2E 테스트 변환
```python
# tests/test_e2e_auth.py
class TestAuthE2E:
    async def test_register_login_flow(self, client: TestClient):
        # apps/backend/test/app.e2e-spec.ts 내용 이식
        pass
```

### 6.2 API 호환성 검증
- 같은 요청/응답 스키마 확인
- 프론트엔드 연동 테스트

## Phase 7: 배포 및 전환 (2-3일)

### 7.1 Blue-Green 배포 준비
- Docker 이미지 빌드
- 환경변수 설정
- Health check 엔드포인트

### 7.2 점진적 전환
1. 개발 환경에서 FastAPI 테스트
2. 스테이징 환경 배포
3. 프로덕션 A/B 테스트
4. 완전 전환

## 예상 일정 및 리소스

- **총 기간**: 15-20일
- **개발자**: 1-2명
- **테스트 케이스**: 750개 (기존 NestJS 테스트 기준)
- **API 엔드포인트**: 30여개

## 마이그레이션 도구 및 스크립트

### 자동화 도구 개발
1. **테스트 변환 스크립트**: Jest → Pytest 자동 변환
2. **타입 매핑 도구**: TypeScript → Pydantic 스키마 변환
3. **API 스펙 검증**: OpenAPI 스펙 호환성 확인

## 리스크 관리

### 주요 리스크
1. **복잡한 비즈니스 로직**: 할일 이동 로직, 카테고리 관리
2. **Redis 연동**: 기존 데이터 호환성
3. **JWT 토큰**: 기존 토큰과의 호환성

### 완화 방안
1. **테스트 우선**: 기존 테스트를 먼저 포팅하여 동작 보장
2. **점진적 마이그레이션**: 모듈별 단계적 전환
3. **롤백 계획**: 문제 발생 시 즉시 NestJS로 되돌리기

## 현재 NestJS 백엔드 분석

### 주요 컴포넌트
- **인증 시스템**: JWT 기반, Passport 전략 패턴
- **사용자 관리**: 프로필, 비밀번호 변경
- **할일 관리**: CRUD, 카테고리별 필터링, 통계
- **설정 관리**: 사용자별 설정, 카테고리 관리
- **Redis 저장소**: 사용자별 격리된 데이터 저장

### 테스트 현황
- **총 750개 테스트 케이스** 통과
- **단위 테스트**: 서비스, 리포지토리, 엔티티별
- **통합 테스트**: 컨트롤러, 인증 플로우
- **E2E 테스트**: 전체 API 플로우

### API 엔드포인트
- **인증**: `/auth/*` (register, login, refresh, logout)
- **사용자**: `/users/*` (profile, change-password)
- **할일**: `/todos/*` (CRUD, stats, move-tasks)
- **설정**: `/user-settings/*` (settings, categories)

이 계획을 통해 기존 테스트 케이스를 활용한 안전하고 체계적인 마이그레이션이 가능할 것으로 예상됩니다.