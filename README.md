# TODO Calendar

[![Backend CI](https://github.com/gytkk/todo/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/gytkk/todo/actions/workflows/backend-ci.yml)
[![Frontend CI](https://github.com/gytkk/todo/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/gytkk/todo/actions/workflows/frontend-ci.yml)

## 🚀 시작하기

### 필수 조건

- Node.js 18+
- pnpm 패키지 매니저
- Docker & Docker Compose (데이터베이스용)

### 설치 및 실행

```bash
# 의존성 설치
pnpm install

# 데이터베이스 서비스 시작 (PostgreSQL)
docker-compose up -d

# 개발 서버 실행
turbo dev

# 프론트엔드만 실행
turbo dev --filter=frontend

# 백엔드만 실행
turbo dev --filter=backend
```

- **프론트엔드**: <http://localhost:3000>
- **백엔드 API**: <http://localhost:3001>
- **API 문서**: <http://localhost:3001/docs>
- **pgAdmin (PostgreSQL)**: <http://localhost:8080>

## 🛠️ 주요 명령어

### 개발

- `turbo dev` - 전체 개발 서버 실행
- `turbo build` - 전체 빌드
- `turbo lint` - 코드 린트
- `turbo type-check` - 타입 검사

### 테스트

- `turbo test` - 단위 테스트
- `turbo test:e2e` - E2E 테스트
- 테스트 커버리지 확인: <https://gytkk.github.io/todo/>

## 📁 프로젝트 구조

```text
apps/
├── frontend/                    # Next.js 프론트엔드
│   ├── src/app/                # 페이지 (App Router)
│   ├── src/components/         # UI 컴포넌트
│   └── src/contexts/          # React 컨텍스트
├── backend/                    # Fastify 백엔드
│   ├── src/services/          # 비즈니스 로직
│   ├── src/repositories/      # 데이터 접근 계층
│   ├── src/plugins/           # Fastify 플러그인
│   ├── src/routes/            # API 라우트
│   └── prisma/                # 데이터베이스 스키마
packages/
├── shared-config/             # 공통 설정
├── shared-types/              # 공통 타입
└── ui/                       # 공통 UI 컴포넌트
docs/                          # 프로젝트 문서
docker-compose.yml             # 데이터베이스 인프라
```

## ✨ 주요 기능

### 캘린더 시스템

- 맞춤형 한국어 달력
- 월별/일별 보기
- 부드러운 날짜 탐색

### 할일 관리

- 카테고리별 할일 분류
- 완료/미완료 상태 관리
- 날짜별 할일 정리

### 설정 관리

- 사용자 프로필
- 카테고리 관리
- 테마 설정 (라이트/다크/시스템)
- 언어 설정

### 통계 및 분석

- 사용 현황 분석
- 완료율 추적
- 데이터 내보내기/가져오기

## 🔧 기술 스택

### 프론트엔드

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- React 19

### 백엔드

- Fastify (고성능 웹 프레임워크)
- TypeScript
- PostgreSQL 15 (Primary Database)
- Prisma ORM (타입 안전 데이터베이스 접근)
- JWT 인증
- Docker Compose 인프라

### 개발 도구

- Turborepo (모노레포)
- pnpm (패키지 관리)
- ESLint + Prettier
- Jest (테스트 프레임워크)
- Docker Compose (인프라)
- pgAdmin (PostgreSQL 관리)

## 🏗️ 아키텍처

### 데이터베이스 아키텍처

- **PostgreSQL**: 주 데이터베이스 (사용자, 할일, 카테고리, 설정)
- **Prisma ORM**: 타입 안전 데이터베이스 접근
- **외래키 관계**: 데이터 무결성 보장
- **트랜잭션 지원**: ACID 속성 보장
- **자동 마이그레이션**: 스키마 버전 관리

### API 아키텍처

- **Fastify 프레임워크**: 고성능 Node.js 웹 프레임워크
- **플러그인 시스템**: 모듈화된 기능 구성
- **JWT 인증**: 안전한 토큰 기반 인증
- **Swagger/OpenAPI**: 자동 API 문서화
- **타입 안전성**: TypeScript + Prisma

## 🐳 Docker 환경

### 서비스 구성

- **PostgreSQL 15**: 주 데이터베이스 (포트 5432)
- **pgAdmin**: PostgreSQL 관리 도구 (포트 8080)

### 데이터베이스 접근

```bash
# PostgreSQL 접속
docker exec -it todo-postgres psql -U todouser -d todoapp

# 서비스 상태 확인
docker-compose ps

# 로그 확인
docker-compose logs postgres
```

## 🧪 테스트

### 테스트 종류

- **단위 테스트**: Jest 기반 컴포넌트/서비스 테스트
- **통합 테스트**: PostgreSQL 데이터베이스 통합 테스트
- **E2E 테스트**: 전체 워크플로우 테스트

### 테스트 실행

```bash
# 전체 테스트
turbo test

# 백엔드 테스트 (커버리지 포함)
turbo test:cov --filter=backend

# 프론트엔드 테스트
turbo test --filter=frontend

# 테스트 감시 모드
turbo test:watch --filter=backend
```

## 📊 최신 변경사항

### PostgreSQL 마이그레이션 (2024.08)

- ✅ **완료**: Redis → PostgreSQL 전체 마이그레이션
- ✅ **완료**: Prisma ORM 통합
- ✅ **완료**: Fastify 프레임워크 적용
- ✅ **완료**: Repository 패턴 구현
- ✅ **완료**: 통합 테스트 suite 구축

### 주요 개선사항

- **성능**: 관계형 데이터베이스의 최적화된 쿼리
- **확장성**: 외래키 관계와 인덱스를 통한 확장 가능한 구조
- **안정성**: 트랜잭션과 제약조건을 통한 데이터 무결성
- **개발 경험**: 타입 안전성과 자동 마이그레이션

## 🤝 기여하기

### 개발 환경 설정

1. 저장소 클론
2. `pnpm install` 실행
3. `docker-compose up -d` 실행
4. `turbo dev` 실행

### 코드 스타일

- TypeScript 강타입 사용
- Prisma를 통한 데이터베이스 접근
- ESLint/Prettier 규칙 준수
- 테스트 작성 필수

## 📚 추가 문서

- [CLAUDE.md](./CLAUDE.md) - 개발자를 위한 상세 가이드
- [docs/PostgreSQL_Setup.md](./docs/PostgreSQL_Setup.md) - 데이터베이스 설정 가이드
- [docs/Integration_Test_Report.md](./docs/Integration_Test_Report.md) - 통합 테스트 결과
