# NestJS에서 Fastify로 마이그레이션 계획

## 개요

현재 NestJS 기반의 백엔드 API 서버를 Fastify로 마이그레이션하여 더 간단하고 직관적인 개발 경험과 향상된 성능을 달성하고자 합니다.

## 현재 아키텍처 분석

### 기술 스택

- **Framework**: NestJS 11.x
- **Database**: Redis (ioredis)
- **Authentication**: JWT (Passport.js)
- **Validation**: class-validator
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest

### 주요 모듈

1. **Auth Module**: JWT 기반 인증, 회원가입/로그인
2. **User Module**: 사용자 프로필 관리
3. **Todo Module**: 할일 CRUD, 통계, 작업 이동
4. **UserSettings Module**: 설정 및 카테고리 관리
5. **Redis Module**: 데이터 저장소 관리

## 단계별 마이그레이션 전략

### 1단계: 새로운 Fastify 프로젝트 구조 준비

#### 1.1 디렉토리 구조

```
apps/backend-fastify/
├── src/
│   ├── server.ts           # Fastify 서버 진입점
│   ├── app.ts             # 앱 초기화 및 플러그인 등록
│   ├── config/            # 환경 설정
│   ├── plugins/           # Fastify 플러그인
│   ├── routes/            # 라우트 정의
│   ├── services/          # 비즈니스 로직
│   ├── repositories/      # 데이터 접근 계층
│   ├── schemas/           # JSON Schema 정의
│   ├── hooks/             # Fastify hooks
│   └── utils/             # 유틸리티 함수
├── tests/
├── package.json
└── tsconfig.json
```

#### 1.2 필수 패키지

```json
{
  "dependencies": {
    "fastify": "^4.x",
    "@fastify/cors": "^9.x",
    "@fastify/helmet": "^11.x",
    "@fastify/jwt": "^8.x",
    "@fastify/swagger": "^8.x",
    "@fastify/env": "^4.x",
    "ioredis": "^5.x",
    "bcrypt": "^5.x",
    "date-fns": "^4.x",
    "uuid": "^11.x",
    "zod": "^3.x"
  },
  "devDependencies": {
    "@types/node": "^22.x",
    "typescript": "^5.x",
    "tsx": "^4.x",
    "jest": "^29.x",
    "@types/jest": "^29.x"
  }
}
```

### 2단계: 핵심 인프라 마이그레이션

#### 2.1 Redis 연결 모듈

더 이상 Redis를 데이터베이스로 사용하지 않고, 대신 postgresql 기반의 데이터베이스를 사용하도록 전환할 예정입니다.
이 과정에서 필요한 Redis 연결 모듈을 제거하고, PostgreSQL 클라이언트를 설정합니다.

```typescript

#### 2.2 Repository 패턴 유지

- `BaseRedisRepository`: 기본 CRUD 연산
- `UserScopedRedisRepository`: 사용자별 데이터 격리
- 기존 NestJS 구현을 Fastify 컨텍스트에 맞게 조정

### 3단계: 인증 시스템 마이그레이션

#### 3.1 JWT 인증 구현

```typescript
// src/plugins/auth.ts
import fp from 'fastify-plugin'
import jwt from '@fastify/jwt'

export default fp(async (fastify) => {
  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'fallback-secret'
  })

  fastify.decorate('authenticate', async (request, reply) => {
    try {
      await request.jwtVerify()
    } catch (err) {
      reply.send(err)
    }
  })
})
```

#### 3.2 기존 Guard → Hook 전환

- `JwtAuthGuard` → `preHandler` hook
- `Public` 데코레이터 → 라우트 옵션

### 4단계: 비즈니스 모듈 마이그레이션

#### 4.1 User 모듈

- 라우트: `/users/*`
- 기능: 프로필 조회/수정, 비밀번호 변경
- Service 클래스 재사용

#### 4.2 Auth 모듈

- 라우트: `/auth/*`
- 기능: 회원가입, 로그인, 토큰 갱신
- Passport 전략을 직접 구현으로 대체

#### 4.3 Todo 모듈

- 라우트: `/todos/*`
- 기능: CRUD, 통계, 작업 이동
- 복잡한 비즈니스 로직 유지

#### 4.4 UserSettings 모듈

- 라우트: `/user-settings/*`
- 기능: 설정 관리, 카테고리 CRUD
- 마이그레이션 로직 포함

### 5단계: 미들웨어 및 플러그인 설정

#### 5.1 보안 설정

```typescript
// Helmet
await fastify.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
})
```

#### 5.2 CORS 설정

```typescript
await fastify.register(cors, {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
})
```

#### 5.3 Validation

- JSON Schema 기반 검증
- Zod 스키마를 JSON Schema로 변환
- 타입 안전성 유지

#### 5.4 API 문서화

```typescript
await fastify.register(swagger, {
  swagger: {
    info: {
      title: 'Todo Calendar API',
      description: 'Calendar-based todo application API',
      version: '1.0.0'
    }
  }
})
```

### 6단계: 테스트 마이그레이션

#### 6.1 테스트 전략

- Jest 설정 유지
- `fastify.inject()` 사용하여 HTTP 테스트
- 기존 테스트 케이스 로직 재활용

#### 6.2 테스트 구조

```typescript
describe('TodoController', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = await buildApp()
  })

  afterAll(async () => {
    await app.close()
  })

  it('should create todo', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/todos',
      headers: { authorization: 'Bearer TOKEN' },
      payload: { title: 'Test Todo' }
    })
    
    expect(response.statusCode).toBe(201)
  })
})
```

## 주요 변경사항 매핑

### 라우팅 구조

| NestJS | Fastify |
|--------|---------|
| `@Controller('todos')` | `fastify.register(todoRoutes, { prefix: '/todos' })` |
| `@Get(':id')` | `fastify.get('/:id', handler)` |
| `@UseGuards(JwtAuthGuard)` | `{ preHandler: [authenticate] }` |
| `@Body() dto: CreateTodoDto` | `request.body (with schema validation)` |

### 의존성 주입

| NestJS | Fastify |
|--------|---------|
| Constructor DI | Manual instantiation or DI library |
| `@Injectable()` | Plain class |
| Module system | Plugin system |

### 검증

| NestJS | Fastify |
|--------|---------|
| class-validator | JSON Schema / Zod |
| ValidationPipe | Schema validation |
| DTO classes | TypeScript interfaces + schemas |

## 점진적 마이그레이션 전략

### Phase 1: 병렬 운영 (1주)

1. Fastify 서버를 포트 3002에서 실행
2. 기본 health check 및 인증 엔드포인트 구현
3. 프론트엔드에서 일부 API 테스트

### Phase 2: 모듈별 마이그레이션 (2주)

1. **Day 1-2**: User 모듈
2. **Day 3-4**: Auth 모듈
3. **Day 5-7**: Todo 모듈
4. **Day 8-9**: UserSettings 모듈
5. **Day 10**: 통합 테스트

### Phase 3: 전환 및 안정화 (1주)

1. 로드 밸런서/프록시 설정
2. 트래픽 점진적 전환 (10% → 50% → 100%)
3. 모니터링 및 버그 수정
4. 성능 측정 및 최적화

### Phase 4: 정리 (2일)

1. NestJS 코드 제거
2. 문서 업데이트
3. CI/CD 파이프라인 수정

## 예상 효과

### 성능 향상

- 요청 처리량: 약 2-3배 향상 예상
- 메모리 사용량: 약 30-40% 감소
- 시작 시간: 50% 이상 단축

### 개발 경험

- 보일러플레이트 코드 감소
- 더 직관적인 코드 구조
- 빠른 개발 사이클

### 유지보수

- 단순한 의존성 구조
- 명시적인 플러그인 시스템
- 더 나은 타입 추론

## 위험 요소 및 대응 방안

### 위험 요소

1. **DI 패턴 변경**: 수동 의존성 관리 복잡도
2. **데코레이터 부재**: 메타데이터 기반 기능 재구현 필요
3. **생태계 차이**: 일부 NestJS 전용 패키지 대체 필요

### 대응 방안

1. **DI 라이브러리 도입**: awilix 또는 tsyringe 검토
2. **명시적 구현**: 데코레이터 대신 명시적 설정 사용
3. **대체 패키지 조사**: Fastify 생태계 내 대안 확보

## 결론

NestJS에서 Fastify로의 마이그레이션은 성능 향상과 개발 경험 개선을 가져올 것으로 예상됩니다. 점진적 마이그레이션 전략을 통해 서비스 중단 없이 안전하게 전환할 수 있으며, 전체 과정은 약 3-4주가 소요될 것으로 예상됩니다.
