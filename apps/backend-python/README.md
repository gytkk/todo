# Backend Python (FastAPI)

Calendar Todo FastAPI 백엔드 서버

## 개요

이 프로젝트는 NestJS에서 Python FastAPI로 마이그레이션된 백엔드 API 서버입니다.

## 기술 스택

- **Framework**: FastAPI 0.115.6
- **Python**: 3.11+
- **Database**: Redis
- **Authentication**: JWT with python-jose
- **Password Hashing**: bcrypt via passlib
- **Testing**: pytest with asyncio support
- **Code Quality**: black, isort, flake8, mypy

## 개발 환경 설정

### 1. 가상환경 생성 및 활성화

```bash
cd apps/backend-python
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate  # Windows
```

### 2. 의존성 설치

```bash
pip install -r requirements.txt
```

### 3. 개발 서버 실행

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

### 4. API 문서 확인

- Swagger UI: http://localhost:8001/docs
- ReDoc: http://localhost:8001/redoc

## 테스트

### 단위 테스트 실행

```bash
pytest
```

### 커버리지 리포트

```bash
coverage run -m pytest
coverage report
coverage html  # HTML 리포트 생성
```

## 코드 품질 도구

### 코드 포맷팅

```bash
black app/
isort app/
```

### 린팅

```bash
flake8 app/
mypy app/
```

## 프로젝트 구조

```
app/
├── __init__.py
├── main.py                 # FastAPI 앱 엔트리포인트
├── core/
│   ├── config.py          # 설정 관리
│   ├── security.py        # JWT, 보안 관련
│   └── dependencies.py    # 의존성 주입
├── api/
│   └── v1/
│       ├── auth.py        # 인증 엔드포인트
│       ├── todos.py       # 할일 엔드포인트
│       ├── users.py       # 사용자 엔드포인트
│       └── user_settings.py # 사용자 설정 엔드포인트
├── models/                # 도메인 모델
├── schemas/               # Pydantic 스키마
├── services/              # 비즈니스 로직
├── repositories/          # 데이터 액세스 레이어
└── tests/                 # 테스트 코드
```

## 환경 변수

다음 환경 변수들이 필요합니다:

```env
# Redis 설정
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=todoapp123
REDIS_DB=0

# JWT 설정
JWT_SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=30

# 앱 설정
APP_NAME="Calendar Todo API"
APP_VERSION="1.0.0"
DEBUG=true
```

## API 엔드포인트

### 인증 (`/auth`)
- `POST /auth/register` - 사용자 등록
- `POST /auth/login` - 로그인
- `POST /auth/refresh` - 토큰 갱신
- `POST /auth/logout` - 로그아웃

### 사용자 (`/users`)
- `GET /users/me` - 현재 사용자 정보
- `PUT /users/me` - 사용자 정보 수정
- `PUT /users/me/password` - 비밀번호 변경

### 할일 (`/todos`)
- `GET /todos` - 할일 목록 조회
- `POST /todos` - 할일 생성
- `GET /todos/{id}` - 할일 상세 조회
- `PUT /todos/{id}` - 할일 수정
- `DELETE /todos/{id}` - 할일 삭제
- `PATCH /todos/{id}/toggle` - 할일 완료 상태 토글
- `GET /todos/stats` - 할일 통계
- `POST /todos/move-tasks` - 작업 이동

### 사용자 설정 (`/user-settings`)
- `GET /user-settings` - 사용자 설정 조회
- `PUT /user-settings` - 사용자 설정 업데이트
- `GET /user-settings/categories` - 카테고리 목록
- `POST /user-settings/categories` - 카테고리 생성
- `PUT /user-settings/categories/{id}` - 카테고리 수정
- `DELETE /user-settings/categories/{id}` - 카테고리 삭제

## NestJS와의 주요 차이점

1. **의존성 주입**: NestJS의 DI 컨테이너 대신 FastAPI의 Depends 시스템 사용
2. **데코레이터**: NestJS 데코레이터를 FastAPI의 함수 기반 접근법으로 변경
3. **모듈 시스템**: NestJS 모듈을 FastAPI 라우터로 변경
4. **타입 검증**: class-validator 대신 Pydantic 사용
5. **테스팅**: Jest 대신 pytest 사용

## 마이그레이션 상태

- [x] 프로젝트 구조 설정
- [ ] 인증 시스템 구현
- [ ] 사용자 관리 구현  
- [ ] 할일 관리 구현
- [ ] 설정 관리 구현
- [ ] 테스트 마이그레이션
- [ ] E2E 테스트
- [ ] 배포 설정