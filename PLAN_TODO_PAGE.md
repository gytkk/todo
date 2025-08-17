# 할 일만 볼 수 있는 새로운 페이지 구현 계획

## 1. 프로젝트 분석 결과

현재 프로젝트는 Next.js 15 App Router를 사용하며, 다음과 같은 구조를 가지고 있습니다:

### 기존 페이지 구조
- `/` - 홈 (캘린더 뷰 + 할 일 관리)
- `/statistics` - 통계 페이지
- `/settings` - 설정 페이지
- `/login`, `/register`, `/forgot-password` - 인증 관련 페이지

### 기존 컴포넌트
- `Sidebar` - 왼쪽 사이드바 (메뉴 네비게이션)
- `TodoSidebar` - 할 일 관리용 사이드바 (홈에서 사용)
- `TodoList` - 할 일 목록 컴포넌트
- `TodoItem` - 개별 할 일 아이템
- `TodoForm` - 할 일 추가/수정 폼
- `TodoStats` - 할 일 통계

## 2. 새로운 "할 일" 페이지 구현 계획

### A. 페이지 및 라우팅 설정

#### 파일 생성
1. **페이지 파일**: `apps/frontend/src/app/todos/page.tsx`
   - 새로운 할 일 전용 페이지
   - `withAuth` HOC로 인증 보호
   - AppLayout 사용

#### 타입 정의 업데이트
2. **PageType 확장**: `packages/shared-types/src/app.ts`
   - `PageType`에 "todos" 추가: `"home" | "statistics" | "settings" | "todos"`

### B. 사이드바 메뉴 추가

#### 사이드바 업데이트
3. **메뉴 아이템 추가**: `apps/frontend/src/components/sidebar.tsx`
   - 새로운 메뉴 아이템 추가:
     ```typescript
     {
       id: "todos",
       name: "할 일",
       icon: CheckSquare, // lucide-react에서 import
       href: "/todos",
     }
     ```
   - 메뉴 순서: 홈 → 할 일 → 통계 → 설정

### C. 할 일 페이지 컴포넌트 구현

#### 새로운 컴포넌트 생성
4. **TodosPage 컴포넌트**: `apps/frontend/src/components/todos/TodosPage.tsx`
   - 할 일 전용 페이지 컴포넌트
   - 필터링 및 정렬 기능
   - 검색 기능
   - 카테고리별 분류
   - 완료/미완료 토글

5. **TodosFilter 컴포넌트**: `apps/frontend/src/components/todos/TodosFilter.tsx`
   - 카테고리 필터
   - 완료 상태 필터 (전체/완료/미완료)
   - 할 일 타입 필터 (전체/이벤트/작업)
   - 날짜 범위 필터

6. **TodosSearch 컴포넌트**: `apps/frontend/src/components/todos/TodosSearch.tsx`
   - 할 일 제목 검색
   - 실시간 검색 기능

7. **TodosView 컴포넌트**: `apps/frontend/src/components/todos/TodosView.tsx`
   - 목록 뷰 / 카드 뷰 전환
   - 정렬 옵션 (날짜순, 카테고리순, 완료순)

### D. 페이지 기능 명세

#### 주요 기능
1. **할 일 목록 표시**
   - 모든 할 일을 한 페이지에서 조회
   - 날짜별, 카테고리별 그룹화 옵션
   - 페이지네이션 또는 무한 스크롤

2. **필터링 기능**
   - 완료 상태: 전체/완료/미완료
   - 할 일 타입: 전체/이벤트/작업
   - 카테고리: 다중 선택 가능
   - 날짜 범위: 특정 기간 선택

3. **검색 기능**
   - 할 일 제목으로 실시간 검색
   - 검색 결과 하이라이트

4. **정렬 기능**
   - 날짜순 (오름차순/내림차순)
   - 카테고리순
   - 완료 상태순
   - 생성일순

5. **할 일 관리**
   - 인라인 편집 (제목 클릭 시)
   - 완료/미완료 토글
   - 삭제
   - 타입 변경 (이벤트 ↔ 작업)
   - 새 할 일 추가

6. **뷰 옵션**
   - 목록 뷰: 간단한 리스트 형태
   - 카드 뷰: 더 자세한 정보와 함께

### E. 파일 구조

```
apps/frontend/src/
├── app/
│   └── todos/
│       └── page.tsx                 # 할 일 페이지
├── components/
│   ├── todos/                       # 새로운 디렉토리
│   │   ├── TodosPage.tsx           # 메인 페이지 컴포넌트
│   │   ├── TodosFilter.tsx         # 필터 컴포넌트
│   │   ├── TodosSearch.tsx         # 검색 컴포넌트
│   │   ├── TodosView.tsx           # 뷰 전환 컴포넌트
│   │   └── index.ts                # 내보내기
│   └── sidebar.tsx                 # 업데이트 (메뉴 추가)
└── hooks/
    └── useTodosPage.ts              # 할 일 페이지 전용 훅
```

### F. 상태 관리

#### 새로운 훅 생성
8. **useTodosPage 훅**: `apps/frontend/src/hooks/useTodosPage.ts`
   - 필터 상태 관리
   - 검색어 상태 관리
   - 정렬 상태 관리
   - 뷰 모드 상태 관리
   - 로컬 스토리지 연동 (설정 저장)

### G. UI/UX 고려사항

1. **반응형 디자인**: 모바일에서도 사용하기 쉽도록
2. **접근성**: 키보드 네비게이션, 스크린 리더 지원
3. **성능**: 대량의 할 일 데이터 처리 최적화
4. **사용자 경험**: 직관적인 필터링 및 검색 인터페이스

## 3. 구현 체크리스트

### 1단계: 타입 정의 및 기본 페이지 구조
- [x] `packages/shared-types/src/app.ts`에서 PageType에 "todos" 추가
- [x] `apps/frontend/src/app/todos/page.tsx` 기본 페이지 생성
- [x] `apps/frontend/src/components/sidebar.tsx`에 할 일 메뉴 아이템 추가
- [x] CheckSquare 아이콘 import 및 적용
- [x] 메뉴 순서 조정 (홈 → 할 일 → 통계 → 설정)
- [x] 기본 라우팅 테스트

### 2단계: 핵심 컴포넌트 구현
- [x] `apps/frontend/src/components/todos/` 디렉토리 생성
- [x] `TodosPage.tsx` 기본 컴포넌트 생성
- [x] AppLayout과 PageHeader 적용
- [x] withAuth HOC 적용
- [x] 기본 할 일 목록 표시 기능 구현
- [x] useTodoContext를 사용한 데이터 연동
- [x] 기본 스타일링 적용

### 3단계: 필터링 및 검색 기능
- [x] `TodosFilter.tsx` 컴포넌트 생성
  - [x] 완료 상태 필터 (전체/완료/미완료)
  - [x] 할 일 타입 필터 (전체/이벤트/작업)
  - [x] 카테고리 다중 선택 필터
  - [ ] 날짜 범위 필터
- [x] `TodosSearch.tsx` 컴포넌트 생성
  - [x] 실시간 검색 기능
  - [x] 검색 결과 하이라이트
- [x] `useTodosPage.ts` 훅 생성
  - [x] 필터 상태 관리
  - [x] 검색어 상태 관리
  - [x] 로컬 스토리지 연동
- [x] 필터 및 검색 로직 통합

### 4단계: 고급 기능 및 UX 개선
- [x] `TodosView.tsx` 컴포넌트 생성
  - [ ] 목록 뷰 / 카드 뷰 전환
  - [x] 정렬 옵션 구현 (날짜순, 카테고리순, 완료순)
- [x] 할 일 관리 기능 통합
  - [x] 인라인 편집 기능 (기존 TodoList 컴포넌트 사용)
  - [x] 완료/미완료 토글
  - [x] 삭제 기능
  - [x] 타입 변경 기능
  - [ ] 새 할 일 추가 기능
- [ ] 페이지네이션 또는 가상화 구현
- [x] 반응형 디자인 적용
- [x] 성능 최적화 (메모화, 지연 로딩)

### 5단계: 테스트 및 최종 검토
- [x] 타입 체크 실행 및 오류 수정
- [x] 모든 기능 테스트
  - [x] 필터링 동작 확인
  - [x] 검색 기능 확인
  - [x] 정렬 기능 확인
  - [x] 할 일 CRUD 기능 확인
- [x] 반응형 디자인 테스트 (모바일, 태블릿, 데스크톱)
- [x] 접근성 검토
  - [x] 키보드 네비게이션
  - [x] 스크린 리더 지원
  - [x] 색상 대비 확인
- [x] 코드 리뷰 및 최적화
- [x] 문서화 완료

### 6단계: 추가 개선사항 (선택적)
- [ ] 할 일 그룹화 기능 (날짜별, 카테고리별)
- [ ] 대량 작업 기능 (일괄 삭제, 일괄 완료)
- [ ] 할 일 내보내기/가져오기 기능
- [ ] 고급 필터 옵션 (생성일, 수정일 기준)
- [ ] 즐겨찾기 필터 설정 저장
- [ ] 할 일 템플릿 기능

## 4. 기대 효과

이 새로운 할 일 페이지를 통해 사용자는:
- 캘린더 뷰와 별도로 모든 할 일을 한 곳에서 관리
- 강력한 필터링과 검색으로 원하는 할 일을 빠르게 찾기
- 다양한 정렬 옵션으로 할 일을 효율적으로 정리
- 목록/카드 뷰로 선호하는 방식으로 할 일 확인
- 모바일에서도 편리한 할 일 관리 경험