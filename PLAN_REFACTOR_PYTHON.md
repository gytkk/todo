# NestJS → FastAPI 마이그레이션 체크리스트

## 🔄 마이그레이션 진행 상황

### ✅ 완료된 항목 (Phase 1-3)

#### 1. 프로젝트 구조 설정
- [x] FastAPI 프로젝트 초기화 (`apps/backend-python/`)
- [x] 기본 디렉토리 구조 생성 (app/, api/, core/, models/, repositories/, schemas/, services/, tests/)
- [x] 의존성 설정 (pyproject.toml, requirements.txt)
- [x] uv 패키지 매니저 설정
- [x] Docker 설정 파일 생성

#### 2. Core 기능
- [x] Configuration 설정 (`app/core/config.py`)
  - [x] Pydantic BaseSettings 사용
  - [x] 환경 변수 관리
  - [x] Redis 연결 설정
- [x] Security 유틸리티 (`app/core/security.py`)
  - [x] JWT 토큰 생성/검증
  - [x] 비밀번호 해싱/검증
  - [x] 비밀번호 강도 검증
- [x] Dependencies (`app/core/dependencies.py`)
  - [x] 기본 파일 생성

#### 3. 모델 및 스키마
- [x] Base 모델 (`app/models/base.py`)
- [x] User 모델 (`app/models/user.py`)
- [x] Todo 모델 (`app/models/todo.py`)
  - [x] TodoType (EVENT, TASK) enum
  - [x] Priority enum
- [x] Category 모델 (`app/models/category.py`)
- [x] UserSettings 모델 (`app/models/user_settings.py`)
- [x] 모든 관련 스키마 (schemas/)

#### 4. Repository 계층
- [x] Base Redis Repository (`app/repositories/base_redis.py`)
- [x] User Scoped Redis Repository (`app/repositories/user_scoped_redis.py`)
- [x] User Repository (`app/repositories/user_repository.py`)
- [x] Todo Repository (`app/repositories/todo_repository.py`)
- [x] Category Repository (`app/repositories/category_repository.py`)
- [x] UserSettings Repository (`app/repositories/user_settings_repository.py`)

#### 5. 테스트
- [x] Core 기능 테스트 (`test_core.py`) - 100% 통과
- [x] 모델 테스트 (`test_models.py`) - 100% 통과
- [x] Repository 테스트 (`test_repositories.py`) - 일부 구현
- [x] Main app 테스트 (`test_main.py`) - 일부 구현

### ❌ 미구현 항목 (Phase 4-7)

#### 1. Service 계층 (Phase 4)
- [x] Auth Service
  - [x] 회원가입 로직
  - [x] 로그인 로직
  - [x] 토큰 갱신 로직
  - [x] 로그아웃 로직
- [x] User Service
  - [x] 사용자 정보 조회
  - [x] 사용자 정보 수정
  - [x] 비밀번호 변경
  - [x] 계정 삭제
- [x] Todo Service
  - [x] Todo CRUD 작업
  - [x] Task 이동 로직 (move-tasks)
  - [x] 만료된 Task 조회 (tasks-due)
  - [x] 통계 생성 (stats)
  - [x] 완료 상태 토글
  - [x] 전체 삭제
- [x] UserSettings Service
  - [x] 설정 조회/수정
  - [x] 카테고리 CRUD
  - [x] 카테고리 재정렬
  - [x] 필터 설정
  - [x] 데이터 export/import
  - [x] 설정 초기화

#### 2. API 엔드포인트 (Phase 5)
- [ ] Auth 라우터 (`/auth`)
  - [ ] POST `/auth/register`
  - [ ] POST `/auth/login`
  - [ ] POST `/auth/refresh`
  - [ ] POST `/auth/logout`
- [ ] Users 라우터 (`/users`)
  - [ ] GET `/users/me`
  - [ ] PUT `/users/me`
  - [ ] PUT `/users/me/password`
  - [ ] DELETE `/users/me`
- [ ] Todos 라우터 (`/todos`)
  - [ ] POST `/todos`
  - [ ] GET `/todos` (with filters)
  - [ ] POST `/todos/move-tasks`
  - [ ] GET `/todos/tasks-due`
  - [ ] GET `/todos/stats`
  - [ ] GET `/todos/:id`
  - [ ] PUT `/todos/:id`
  - [ ] PATCH `/todos/:id/toggle`
  - [ ] DELETE `/todos/:id`
  - [ ] DELETE `/todos` (delete all)
- [ ] UserSettings 라우터 (`/user-settings`)
  - [ ] GET `/user-settings`
  - [ ] PUT `/user-settings`
  - [ ] GET `/user-settings/categories`
  - [ ] POST `/user-settings/categories`
  - [ ] PUT `/user-settings/categories/:id`
  - [ ] DELETE `/user-settings/categories/:id`
  - [ ] GET `/user-settings/categories/available-colors`
  - [ ] PUT `/user-settings/categories/:id/filter`
  - [ ] GET `/user-settings/category-filter`
  - [ ] PUT `/user-settings/categories/reorder`
  - [ ] POST `/user-settings/reset`
  - [ ] GET `/user-settings/export`
  - [ ] POST `/user-settings/import`

#### 3. 미들웨어 및 Guards (Phase 5)
- [ ] JWT 인증 미들웨어
- [ ] Current User 의존성 주입
- [ ] Public 라우트 데코레이터
- [ ] 에러 핸들러
- [ ] Request 검증

#### 4. 통합 테스트 (Phase 6)
- [ ] E2E 테스트 설정
- [ ] Auth 통합 테스트
- [ ] Todo 통합 테스트
- [ ] UserSettings 통합 테스트
- [ ] 전체 시나리오 테스트

#### 5. 추가 기능 (Phase 7)
- [ ] Swagger/OpenAPI 문서화
- [ ] 로깅 시스템
- [ ] 성능 모니터링
- [ ] Rate limiting
- [ ] Health check 개선

### 📊 전체 진행률

- **완료**: ~30% (기본 구조, 모델, Repository)
- **진행 중**: Service 계층 구현 필요
- **미시작**: API 엔드포인트, 통합 테스트

### 🎯 다음 단계

1. **Service 계층 구현** (Phase 4)
   - TDD 방식으로 NestJS 테스트를 참고하여 구현
   - 비즈니스 로직 마이그레이션

2. **API 라우터 구현** (Phase 5)
   - FastAPI 라우터 생성
   - Request/Response 모델 바인딩
   - 인증/인가 미들웨어 적용

3. **통합 테스트** (Phase 6)
   - 기존 NestJS E2E 테스트를 pytest로 변환
   - API 전체 플로우 테스트

### 📝 주의사항

1. **Redis Key 구조**: NestJS와 동일한 키 구조 유지 필요
2. **JWT 토큰 형식**: Frontend와 호환성 유지
3. **API Response 형식**: shared-types와 일치 필요
4. **날짜 처리**: UTC 시간대 일관성 유지
5. **에러 응답**: NestJS와 동일한 형식 유지