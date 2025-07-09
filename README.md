# TODO Calendar

[![Backend CI](https://github.com/gytkk/todo/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/gytkk/todo/actions/workflows/backend-ci.yml)
[![Frontend CI](https://github.com/gytkk/todo/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/gytkk/todo/actions/workflows/frontend-ci.yml)

## 🚀 시작하기

### 필수 조건

- Node.js 18+
- pnpm 패키지 매니저

### 설치 및 실행

```bash
# 의존성 설치
pnpm install

# 개발 서버 실행
turbo dev

# 프론트엔드만 실행
turbo dev --filter=frontend

# 백엔드만 실행
turbo dev --filter=backend
```

프론트엔드: <http://localhost:3000>
백엔드: <http://localhost:3001>

## 🛠️ 주요 명령어

### 개발

- `turbo dev` - 전체 개발 서버 실행
- `turbo build` - 전체 빌드
- `turbo lint` - 코드 린트
- `turbo type-check` - 타입 검사

### 테스트

- `turbo test` - 단위 테스트
- `turbo test:e2e` - E2E 테스트

## 📁 프로젝트 구조

```text
apps/
├── frontend/           # Next.js 프론트엔드
│   ├── src/app/       # 페이지 (App Router)
│   ├── src/components/ # UI 컴포넌트
│   └── src/contexts/  # React 컨텍스트
├── backend/           # NestJS 백엔드
│   ├── src/auth/      # 인증 시스템
│   ├── src/todos/     # 할일 관리
│   └── src/users/     # 사용자 관리
packages/
├── shared-config/     # 공통 설정
├── shared-types/      # 공통 타입
└── ui/               # 공통 UI 컴포넌트
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

- NestJS
- TypeScript
- JWT 인증
- 로컬 데이터 저장

### 개발 도구

- Turborepo (모노레포)
- pnpm (패키지 관리)
- ESLint + Prettier
