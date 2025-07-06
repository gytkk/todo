# 사용자 인증 시스템 구현 계획

## 개요

Calendar Todo 애플리케이션에서 사용자 회원가입, 로그인, 인증을 처리하는 백엔드 시스템을 구현합니다. NestJS 프레임워크를 사용하여 JWT 기반 인증 시스템을 구축합니다.

## 1. 데이터 구조 설계

### 1.1 사용자 엔티티 (User Entity)

```typescript
interface User {
  id: string;               // UUID
  email: string;            // 이메일 (고유값)
  password: string;         // 해시된 비밀번호
  name: string;            // 사용자 이름
  createdAt: Date;         // 생성일
  updatedAt: Date;         // 수정일
}
```

### 1.2 JWT 토큰 페이로드

```typescript
interface JwtPayload {
  sub: string;             // 사용자 ID
  email: string;           // 사용자 이메일
  iat: number;            // 발급 시간
  exp: number;            // 만료 시간
}
```

### 1.3 인증 관련 DTO

#### 회원가입 DTO

```typescript
interface CreateUserDTO {
  email: string;           // 이메일 검증 필요
  password: string;        // 최소 8자, 영문+숫자+특수문자
  name: string;           // 2-50자
}
```

#### 로그인 DTO

```typescript
interface LoginDTO {
  email: string;
  password: string;
}
```

#### 인증 응답 DTO

```typescript
interface AuthResponseDTO {
  access_token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}
```

#### 사용자 프로필 DTO

```typescript
interface UserProfileDTO {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}
```

#### 프로필 수정 DTO

```typescript
interface UpdateProfileDTO {
  name?: string;           // 선택적 필드
  currentPassword?: string; // 비밀번호 변경 시 필요
  newPassword?: string;    // 새 비밀번호
}
```

## 2. 필요한 의존성 패키지

### 2.1 Backend 의존성 추가

#### 프로덕션 의존성

```json
{
  "@nestjs/jwt": "^10.2.0",
  "@nestjs/passport": "^10.0.3",
  "@nestjs/config": "^3.1.1",
  "passport-jwt": "^4.0.1",
  "passport-local": "^1.0.0",
  "bcrypt": "^5.1.1",
  "class-validator": "^0.14.0",
  "class-transformer": "^0.5.1",
  "uuid": "^9.0.1"
}
```

#### 개발 의존성

```json
{
  "@types/bcrypt": "^5.0.2",
  "@types/passport-jwt": "^3.0.13",
  "@types/passport-local": "^1.0.38",
  "@types/uuid": "^9.0.7"
}
```

## 3. 파일 구조 및 모듈 설계

### 3.1 Backend 파일 구조

```text
apps/backend/src/
├── auth/
│   ├── auth.module.ts               # 인증 모듈
│   ├── auth.controller.ts           # 인증 컨트롤러
│   ├── auth.service.ts              # 인증 서비스
│   ├── dto/
│   │   ├── create-user.dto.ts       # 회원가입 DTO
│   │   ├── login.dto.ts             # 로그인 DTO
│   │   ├── auth-response.dto.ts     # 인증 응답 DTO
│   │   └── update-profile.dto.ts    # 프로필 수정 DTO
│   ├── guards/
│   │   ├── jwt-auth.guard.ts        # JWT 인증 가드
│   │   └── local-auth.guard.ts      # 로컬 인증 가드
│   ├── strategies/
│   │   ├── jwt.strategy.ts          # JWT 전략
│   │   └── local.strategy.ts        # 로컬 전략
│   └── auth.controller.spec.ts      # 인증 컨트롤러 테스트
├── users/
│   ├── users.module.ts              # 사용자 모듈
│   ├── users.controller.ts          # 사용자 컨트롤러
│   ├── users.service.ts             # 사용자 서비스
│   ├── entities/
│   │   └── user.entity.ts           # 사용자 엔티티
│   ├── dto/
│   │   └── user-profile.dto.ts      # 사용자 프로필 DTO
│   └── users.service.spec.ts        # 사용자 서비스 테스트
├── common/
│   ├── decorators/
│   │   └── current-user.decorator.ts # 현재 사용자 데코레이터
│   ├── interfaces/
│   │   └── jwt-payload.interface.ts  # JWT 페이로드 인터페이스
│   └── exceptions/
│       ├── user-already-exists.exception.ts
│       └── invalid-credentials.exception.ts
├── config/
│   └── auth.config.ts               # 인증 설정
└── app.module.ts                    # 메인 앱 모듈 (업데이트)
```

## 4. 구현 단계별 계획

### Phase 1: 기본 인증 구조 설정

- [ ] 필요한 의존성 패키지 설치
- [ ] 환경 변수 설정 (.env 파일)
- [ ] ConfigModule 설정
- [ ] Users 모듈 기본 구조 생성
- [ ] Auth 모듈 기본 구조 생성

### Phase 2: 사용자 관리 시스템 구현

- [ ] User 엔티티 정의
- [ ] UsersService 구현 (CRUD 기능)
- [ ] 비밀번호 해싱 로직 구현
- [ ] 사용자 검증 로직 구현

### Phase 3: 인증 로직 구현

- [ ] JWT 설정 구성
- [ ] AuthService 구현
- [ ] 회원가입 로직 구현
- [ ] 로그인 로직 구현
- [ ] 토큰 생성/검증 로직 구현

### Phase 4: Passport 전략 구현

- [ ] Local Strategy 구현 (로그인용)
- [ ] JWT Strategy 구현 (인증 검증용)
- [ ] 인증 가드 구현
- [ ] 현재 사용자 데코레이터 구현

### Phase 5: API 엔드포인트 구현

- [ ] POST /auth/register - 회원가입
- [ ] POST /auth/login - 로그인
- [ ] GET /auth/profile - 현재 사용자 정보
- [ ] PUT /auth/profile - 사용자 정보 수정
- [ ] POST /auth/logout - 로그아웃 (선택사항)

### Phase 6: 보안 강화

- [ ] DTO 검증 로직 구현
- [ ] 예외 처리 로직 구현
- [ ] Rate limiting 설정
- [ ] CORS 설정 업데이트

### Phase 7: 테스트 구현

- [ ] AuthService 단위 테스트
- [ ] UsersService 단위 테스트
- [ ] 인증 E2E 테스트
- [ ] API 엔드포인트 테스트

### Phase 8: 프론트엔드 연동 준비

- [ ] 공유 타입 정의 (packages/shared-types)
- [ ] API 문서 작성
- [ ] 인증 플로우 문서화

## 5. API 엔드포인트 명세

### 5.1 회원가입

```text
POST /auth/register
Content-Type: application/json

Request Body:
{
  "email": "user@example.com",
  "password": "Password123!",
  "name": "홍길동"
}

Response (201):
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-string",
    "email": "user@example.com",
    "name": "홍길동"
  }
}
```

### 5.2 로그인

```text
POST /auth/login
Content-Type: application/json

Request Body:
{
  "email": "user@example.com",
  "password": "Password123!"
}

Response (200):
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-string",
    "email": "user@example.com",
    "name": "홍길동"
  }
}
```

### 5.3 프로필 조회

```text
GET /auth/profile
Authorization: Bearer <access_token>

Response (200):
{
  "id": "uuid-string",
  "email": "user@example.com",
  "name": "홍길동",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### 5.4 프로필 수정

```text
PUT /auth/profile
Authorization: Bearer <access_token>
Content-Type: application/json

Request Body:
{
  "name": "새로운이름",
  "currentPassword": "Password123!",    // 비밀번호 변경 시에만
  "newPassword": "NewPassword123!"      // 비밀번호 변경 시에만
}

Response (200):
{
  "id": "uuid-string",
  "email": "user@example.com",
  "name": "새로운이름",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

## 6. 보안 고려사항

### 6.1 비밀번호 보안

- **해싱**: bcrypt 사용 (salt rounds: 12)
- **복잡성**: 최소 8자, 영문 대소문자, 숫자, 특수문자 포함
- **저장**: 원본 비밀번호는 절대 저장하지 않음

### 6.2 JWT 토큰 보안

- **만료 시간**: 15분 (짧은 만료 시간으로 보안 강화)
- **시크릿 키**: 환경변수로 관리, 강력한 랜덤 문자열 사용
- **페이로드**: 민감한 정보 포함하지 않음

### 6.3 API 보안

- **Rate Limiting**: 로그인 시도 제한 (5회/분)
- **입력 검증**: class-validator로 모든 입력 검증
- **HTTPS**: 프로덕션에서 반드시 HTTPS 사용
- **CORS**: 허용된 도메인만 접근 가능

### 6.4 데이터 보안

- **이메일 중복**: 회원가입 시 이메일 중복 검사
- **SQL Injection**: 파라미터화된 쿼리 사용
- **XSS**: 입력 데이터 sanitization

## 7. 환경 설정

### 7.1 환경 변수 (.env)

```env
# JWT 설정
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=15m

# 데이터베이스 설정 (향후 사용)
DATABASE_URL=file:./dev.db

# 애플리케이션 설정
NODE_ENV=development
PORT=3001

# CORS 설정
FRONTEND_URL=http://localhost:3000
```

## 8. 데이터 저장소

### 8.1 초기 구현 (메모리 기반)

- 개발 초기에는 메모리 기반 저장소 사용
- Map 또는 배열을 사용한 간단한 구현
- 서버 재시작 시 데이터 손실 (개발용)

### 8.2 향후 확장 (데이터베이스)

- **SQLite**: 개발/테스트 환경
- **PostgreSQL**: 프로덕션 환경
- **Prisma**: ORM으로 사용 검토
- **Migration**: 스키마 변경 관리

## 9. 테스트 전략

### 9.1 단위 테스트

```typescript
// 테스트 범위
- AuthService.validateUser()
- AuthService.login()
- AuthService.register()
- UsersService.create()
- UsersService.findByEmail()
- PasswordService.hash()
- PasswordService.compare()
```

### 9.2 통합 테스트

```typescript
// 테스트 시나리오
- 회원가입 → 로그인 → 프로필 조회
- 잘못된 자격증명으로 로그인 시도
- 중복 이메일로 회원가입 시도
- 인증되지 않은 상태에서 보호된 라우트 접근
```

### 9.3 E2E 테스트

- 전체 인증 플로우 테스트
- API 엔드포인트 테스트
- 보안 취약점 테스트

## 10. 성능 최적화

### 10.1 캐싱 전략

- JWT 토큰 블랙리스트 (로그아웃 시)
- 사용자 정보 캐싱 (Redis 사용 검토)

### 10.2 데이터베이스 최적화

- 이메일 필드 인덱스 생성
- 쿼리 최적화
- 커넥션 풀 설정

## 11. 모니터링 및 로깅

### 11.1 로깅 전략

- 로그인 시도 로깅
- 실패한 인증 시도 로깅
- 보안 이벤트 로깅

### 11.2 메트릭스

- 로그인 성공/실패 비율
- API 응답 시간
- 동시 사용자 수

## 12. 배포 고려사항

### 12.1 환경별 설정

- 개발: 로컬 환경
- 스테이징: 테스트 환경
- 프로덕션: 실제 서비스 환경

### 12.2 보안 체크리스트

- [ ] HTTPS 설정
- [ ] 환경 변수 보안
- [ ] 방화벽 설정
- [ ] 로그 모니터링
- [ ] 백업 전략

이 계획을 단계별로 구현하여 안전하고 확장 가능한 사용자 인증 시스템을 구축할 예정입니다.
