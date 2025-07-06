# 일별 보기 개선 작업 계획

## 개요
현재 캘린더의 일별 보기를 개선하여 오늘 날짜의 할일을 중심으로 하되, 근처 날짜의 할일들도 함께 표시하는 향상된 UI를 구현합니다.

## 목표
- 오늘 날짜의 할일을 주요 섹션으로 표시
- 어제, 내일의 할일을 보조 섹션으로 표시
- 카테고리별 필터링 적용
- 직관적이고 사용하기 편한 인터페이스 제공

## 작업 계획

### 1. 컴포넌트 구조 설계
- [ ] `DailyView` 메인 컴포넌트 생성
- [ ] `DaySection` 개별 날짜 섹션 컴포넌트 생성
- [ ] `TodoItemCard` 향상된 할일 아이템 컴포넌트 생성

### 2. 날짜 계산 유틸리티
- [ ] 오늘, 어제, 내일 날짜 계산 함수
- [ ] 주어진 날짜 범위의 할일 필터링 함수
- [ ] 날짜별 할일 그룹핑 함수

### 3. UI/UX 디자인
- [ ] 오늘 날짜 섹션 - 강조된 디자인 (큰 제목, 하이라이트)
- [ ] 어제/내일 섹션 - 축소된 디자인 (작은 제목, 회색톤)
- [ ] 날짜 네비게이션 버튼 (이전/다음 날짜로 이동)
- [ ] 스크롤 가능한 레이아웃

### 4. 데이터 통합
- [ ] 카테고리 필터 적용
- [ ] 완료/미완료 상태별 그룹핑
- [ ] 실시간 데이터 업데이트

### 5. 상호작용 기능
- [ ] 할일 완료/미완료 토글
- [ ] 할일 수정/삭제
- [ ] 새 할일 추가 (날짜별)
- [ ] 카테고리 변경

## 컴포넌트 계층 구조

```
DailyView
├── DailyViewHeader (날짜 네비게이션)
├── DaySection (어제)
│   ├── DaySectionHeader
│   └── TodoItemCard[]
├── DaySection (오늘) - 메인 섹션
│   ├── DaySectionHeader
│   ├── QuickAddTodo
│   └── TodoItemCard[]
├── DaySection (내일)
│   ├── DaySectionHeader
│   └── TodoItemCard[]
└── DailyViewFooter (통계/요약)
```

## 데이터 구조

```typescript
interface DailyViewData {
  selectedDate: Date;
  days: {
    yesterday: {
      date: Date;
      todos: TodoItem[];
      stats: { total: number; completed: number; };
    };
    today: {
      date: Date;
      todos: TodoItem[];
      stats: { total: number; completed: number; };
    };
    tomorrow: {
      date: Date;
      todos: TodoItem[];
      stats: { total: number; completed: number; };
    };
  };
}
```

## UI 디자인 명세

### 메인 섹션 (오늘)
- 큰 날짜 타이틀 (예: "12월 15일 (금)")
- 진행률 바 표시
- 카테고리별 할일 그룹핑
- 새 할일 추가 입력창

### 보조 섹션 (어제/내일)
- 작은 날짜 타이틀
- 간단한 할일 목록 (최대 5개)
- "더 보기" 버튼 (많은 할일이 있을 경우)

### 할일 아이템 카드
- 카테고리 색상 표시
- 완료 체크박스
- 할일 제목
- 빠른 액션 버튼 (수정/삭제)

## 기술적 구현 사항

### 1. 날짜 관리
```typescript
const useDailyView = (initialDate: Date = new Date()) => {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  
  const yesterday = useMemo(() => 
    subDays(selectedDate, 1), [selectedDate]);
  const today = selectedDate;
  const tomorrow = useMemo(() => 
    addDays(selectedDate, 1), [selectedDate]);
    
  // ...
};
```

### 2. 할일 필터링
```typescript
const getDayTodos = (date: Date, todos: TodoItem[], categoryFilter: CategoryFilter) => {
  return todos.filter(todo => 
    isSameDay(todo.date, date) && 
    categoryFilter[todo.category.id] !== false
  );
};
```

### 3. 반응형 디자인
- 모바일: 세로 스크롤, 컴팩트한 디자인
- 데스크탑: 3열 레이아웃 (어제|오늘|내일)

## 통합 방법

### CalendarView.tsx 수정
```typescript
const renderDailyView = () => {
  return <DailyView selectedDate={selectedDate} />;
};
```

### 뷰 전환 로직
- 기존 월간/주간 보기와 함께 일간 보기 옵션 추가
- 헤더에 뷰 전환 버튼 추가

## 구현 순서

1. **1단계**: 기본 컴포넌트 구조 생성
2. **2단계**: 날짜 계산 및 데이터 필터링 로직
3. **3단계**: 메인 섹션 (오늘) UI 구현
4. **4단계**: 보조 섹션 (어제/내일) UI 구현
5. **5단계**: 상호작용 기능 구현
6. **6단계**: 카테고리 필터 연동
7. **7단계**: 반응형 디자인 적용
8. **8단계**: 기존 캘린더 뷰와 통합

## 예상 파일 구조

```
apps/frontend/src/components/calendar/
├── daily/
│   ├── DailyView.tsx
│   ├── DailyViewHeader.tsx
│   ├── DaySection.tsx
│   ├── DaySectionHeader.tsx
│   ├── TodoItemCard.tsx
│   ├── QuickAddTodo.tsx
│   └── hooks/
│       ├── useDailyView.ts
│       └── useDayTodos.ts
└── CalendarView.tsx (수정)
```

## 성능 고려사항

- 할일 데이터 메모이제이션
- 가상화된 스크롤 (할일이 많을 경우)
- 지연 로딩 (보조 섹션)

## 접근성 고려사항

- 키보드 내비게이션 지원
- 스크린 리더 호환성
- 적절한 ARIA 라벨링
- 색상 대비 준수

이 계획을 바탕으로 단계별로 구현을 진행하면 사용자 친화적인 일별 보기를 만들 수 있습니다.