# 프로젝트 코드베이스 분석 및 최적화 방안

## 📋 개요
현재 한국어 캘린더 기반 할일 관리 애플리케이션의 코드베이스를 분석하여 구조적 문제점과 최적화 가능한 부분들을 식별했습니다.

## 🔍 주요 발견사항

### 1. 구조적 문제점 (Critical Issues)

#### A. 단일 거대 컴포넌트 문제
**문제**: `src/app/page.tsx`가 332줄의 거대한 단일 컴포넌트
- 모든 상태 관리 (todos, calendar, sidebar, settings)
- 모든 비즈니스 로직 (CRUD, localStorage, event handling)
- 렌더링 로직과 이벤트 핸들러가 혼재

**영향**:
- 코드 가독성 저하
- 디버깅 및 테스트 어려움
- 재사용성 부족
- 성능 최적화 제한

#### B. 상태 관리 분산 문제
**문제**: 여러 컴포넌트에 걸친 상태 관리
```typescript
// page.tsx에서
const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
const [todos, setTodos] = useState<TodoItem[]>([]);
const [newTodoTitle, setNewTodoTitle] = useState("");
const [isSidebarOpen, setIsSidebarOpen] = useState(false);
const [currentPage, setCurrentPage] = useState<PageType>("home");
const [sidebarExpanded, setSidebarExpanded] = useState(true);
const [sidebarVisible, setSidebarVisible] = useState(true);
```

**영향**:
- Prop drilling 발생
- 상태 동기화 복잡성
- 컴포넌트 간 결합도 증가

#### C. 타입 정의 중복
**문제**: 같은 인터페이스가 여러 파일에 중복 정의
- `TodoItem`: page.tsx, settings.tsx
- `AppSettings`: settings.tsx에만 존재
- `CalendarEvent`: page.tsx에만 존재

#### D. 하드코딩된 설정값
**문제**: 매직 넘버와 하드코딩된 값들
```typescript
// 사이드바 너비
className="w-96" // 384px
className="w-64" // 256px
className="w-16" // 64px

// 지연 시간
setTimeout(() => setCopiedJson(false), 2000);
await new Promise<void>(resolve => setTimeout(resolve, 1000));
```

### 2. 성능 관련 문제점

#### A. 불필요한 리렌더링
**문제**: 모든 상태 변경이 전체 컴포넌트 리렌더링 유발
- 사이드바 토글 시 캘린더 전체 재렌더링
- Todo 추가/수정 시 설정 컴포넌트도 함께 렌더링

#### B. 메모이제이션 부재
**문제**: 계산 비용이 높은 함수들이 메모이제이션되지 않음
```typescript
const getCalendarEvents = (): CalendarEvent[] => {
  return todos.map((todo) => ({
    // 매번 새로운 객체 생성
  }));
};
```

#### C. localStorage 비동기 처리 부재
**문제**: localStorage 작업이 동기적으로 처리
```typescript
useEffect(() => {
  localStorage.setItem("calendar-todos", JSON.stringify(todos));
}, [todos]); // 모든 todos 변경시 동기 저장
```

### 3. 코드 품질 문제점

#### A. 한국어 하드코딩
**문제**: UI 텍스트가 하드코딩되어 국제화 불가능
```typescript
placeholder="새 할일을 입력하세요"
"이 날짜에 등록된 할일이 없습니다"
```

#### B. 에러 처리 부족
**문제**: 예외 상황에 대한 처리 미흡
- localStorage 접근 실패 시 처리 없음
- JSON 파싱 실패 시 fallback 없음
- 네트워크 오류 처리 없음

#### C. 접근성 고려사항 부족
**문제**: 웹 접근성 표준 미준수
- ARIA 레이블 누락
- 키보드 네비게이션 제한
- 스크린 리더 지원 부족

### 4. CSS/스타일링 문제점

#### A. CSS 중복 및 복잡성
**문제**: `globals.css`에 309줄의 복잡한 CSS
- react-big-calendar 관련 스타일 오버라이드가 과도함
- 같은 스타일이 여러 선택자로 중복 정의
- `!important` 남용 (총 50+ 개)

#### B. 하드코딩된 색상값
**문제**: CSS 변수 시스템과 별도로 하드코딩된 색상
```css
background-color: #3b82f6 !important;
color: #374151 !important;
border: 1px solid #e5e7eb;
```

#### C. 스타일 우선순위 문제
**문제**: `!important` 남용으로 인한 스타일 우선순위 혼란

### 5. 아키텍처 문제점

#### A. 관심사 분리 부족
**문제**: UI, 비즈니스 로직, 데이터 레이어 혼재
- 컴포넌트에서 직접 localStorage 접근
- UI 컴포넌트에서 데이터 변환 로직 처리

#### B. 의존성 관리 문제
**문제**: 컴포넌트 간 강한 결합
- Sidebar가 parent의 state를 직접 변경
- Settings가 todos 배열을 직접 조작

#### C. 테스트 가능성 부족
**문제**: 현재 구조로는 단위 테스트 작성이 어려움
- 거대한 컴포넌트
- 외부 의존성 (localStorage) 분리 없음

## 🚀 최적화 방안

### 1. 컴포넌트 구조 개선

#### A. 컴포넌트 분할
```
src/
├── components/
│   ├── calendar/
│   │   ├── Calendar.tsx
│   │   ├── CalendarEvent.tsx
│   │   └── CalendarToolbar.tsx
│   ├── todo/
│   │   ├── TodoList.tsx
│   │   ├── TodoItem.tsx
│   │   ├── TodoForm.tsx
│   │   └── TodoSidebar.tsx
│   ├── layout/
│   │   ├── MainLayout.tsx
│   │   ├── NavigationSidebar.tsx
│   │   └── Header.tsx
│   └── settings/
│       ├── SettingsPage.tsx
│       ├── SettingsSection.tsx
│       └── JsonEditor.tsx
```

#### B. 커스텀 훅 도입
```typescript
// hooks/useTodos.ts
export const useTodos = () => {
  // todos 상태 관리 로직
};

// hooks/useCalendar.ts
export const useCalendar = () => {
  // 캘린더 상태 및 이벤트 처리
};

// hooks/useLocalStorage.ts
export const useLocalStorage = <T>(key: string, initialValue: T) => {
  // localStorage 추상화
};
```

### 2. 상태 관리 개선

#### A. Context API 도입
```typescript
// contexts/AppContext.tsx
interface AppContextType {
  todos: TodoItem[];
  settings: AppSettings;
  selectedDate: Date | undefined;
  // ... 기타 전역 상태
}

// contexts/TodoContext.tsx
interface TodoContextType {
  todos: TodoItem[];
  addTodo: (todo: Omit<TodoItem, 'id'>) => void;
  updateTodo: (id: string, updates: Partial<TodoItem>) => void;
  deleteTodo: (id: string) => void;
}
```

#### B. 상태 정규화
```typescript
// types/store.ts
interface NormalizedState {
  todos: {
    byId: Record<string, TodoItem>;
    allIds: string[];
    byDate: Record<string, string[]>;
  };
  ui: {
    selectedDate: Date | undefined;
    sidebarOpen: boolean;
    currentPage: PageType;
  };
  settings: AppSettings;
}
```

### 3. 타입 시스템 강화

#### A. 중앙집중식 타입 정의
```typescript
// types/index.ts
export interface TodoItem {
  id: string;
  title: string;
  date: Date;
  completed: boolean;
  priority?: 'low' | 'medium' | 'high';
  category?: string;
}

export interface CalendarEvent extends Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource?: TodoItem;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: 'ko' | 'en';
  dateFormat: 'YYYY-MM-DD' | 'MM/DD/YYYY' | 'DD/MM/YYYY';
  timeFormat: '12h' | '24h';
  weekStart: 'sunday' | 'monday' | 'saturday';
  defaultView: 'month' | 'week' | 'day';
  showWeekends: boolean;
  autoBackup: boolean;
  backupInterval: 'daily' | 'weekly' | 'monthly';
}
```

#### B. 제네릭 타입 활용
```typescript
// hooks/useLocalStorage.ts
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  // 타입 안전한 localStorage 훅
}
```

### 4. 성능 최적화

#### A. 메모이제이션 적용
```typescript
// components/Calendar.tsx
const CalendarComponent = memo(({ todos, onDateSelect }: CalendarProps) => {
  const calendarEvents = useMemo(() => 
    todos.map(todo => ({
      id: todo.id,
      title: todo.completed ? `✓ ${todo.title}` : todo.title,
      start: todo.date,
      end: todo.date,
      resource: todo,
    })), [todos]
  );

  const handleDateSelect = useCallback((date: Date) => {
    onDateSelect(date);
  }, [onDateSelect]);

  return <Calendar events={calendarEvents} onSelectSlot={handleDateSelect} />;
});
```

#### B. 가상화 도입
```typescript
// components/todo/VirtualizedTodoList.tsx
import { FixedSizeList as List } from 'react-window';

const VirtualizedTodoList = ({ todos }: { todos: TodoItem[] }) => {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <TodoItem todo={todos[index]} />
    </div>
  );

  return (
    <List
      height={400}
      itemCount={todos.length}
      itemSize={60}
    >
      {Row}
    </List>
  );
};
```

#### C. 지연 로딩
```typescript
// pages 지연 로딩
const SettingsPage = lazy(() => import('@/components/settings/SettingsPage'));

// 컴포넌트에서
<Suspense fallback={<LoadingSpinner />}>
  <SettingsPage />
</Suspense>
```

### 5. 데이터 레이어 개선

#### A. 서비스 레이어 도입
```typescript
// services/todoService.ts
export class TodoService {
  private static instance: TodoService;
  
  static getInstance(): TodoService {
    if (!TodoService.instance) {
      TodoService.instance = new TodoService();
    }
    return TodoService.instance;
  }

  async getTodos(): Promise<TodoItem[]> {
    // localStorage에서 데이터 로드
  }

  async saveTodos(todos: TodoItem[]): Promise<void> {
    // localStorage에 데이터 저장
  }

  async exportTodos(): Promise<Blob> {
    // 데이터 내보내기
  }
}
```

#### B. 에러 처리 강화
```typescript
// utils/errorHandler.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public recoverable: boolean = true
  ) {
    super(message);
  }
}

export const withErrorHandling = <T extends (...args: any[]) => any>(
  fn: T,
  fallback?: () => ReturnType<T>
): T => {
  return ((...args) => {
    try {
      return fn(...args);
    } catch (error) {
      console.error('Error in function:', error);
      if (fallback) return fallback();
      throw error;
    }
  }) as T;
};
```

### 6. 스타일링 개선

#### A. CSS 모듈화
```typescript
// styles/Calendar.module.css
.calendar {
  @apply w-full h-full;
}

.eventCompleted {
  @apply opacity-60 line-through;
}

.eventPending {
  @apply opacity-100;
}
```

#### B. 테마 시스템 개선
```typescript
// contexts/ThemeContext.tsx
export const useTheme = () => {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateTheme = () => {
      if (theme === 'system') {
        document.documentElement.classList.toggle('dark', mediaQuery.matches);
      }
    };
    
    mediaQuery.addEventListener('change', updateTheme);
    updateTheme();
    
    return () => mediaQuery.removeEventListener('change', updateTheme);
  }, [theme]);
  
  return { theme, setTheme };
};
```

### 7. 국제화 (i18n) 도입

#### A. 다국어 지원 구조
```typescript
// i18n/index.ts
export const translations = {
  ko: {
    todo: {
      add: '할일 추가',
      complete: '완료',
      delete: '삭제',
      placeholder: '새 할일을 입력하세요'
    },
    calendar: {
      today: '오늘',
      month: '월',
      week: '주',
      day: '일'
    }
  },
  en: {
    todo: {
      add: 'Add Todo',
      complete: 'Complete',
      delete: 'Delete',
      placeholder: 'Enter new todo'
    },
    calendar: {
      today: 'Today',
      month: 'Month',
      week: 'Week',
      day: 'Day'
    }
  }
};

export const useTranslation = () => {
  const { language } = useContext(SettingsContext);
  return (key: string) => get(translations[language], key);
};
```

### 8. 테스트 인프라

#### A. 단위 테스트 구조
```typescript
// __tests__/hooks/useTodos.test.ts
describe('useTodos', () => {
  it('should add new todo', () => {
    const { result } = renderHook(() => useTodos());
    
    act(() => {
      result.current.addTodo({
        title: 'Test Todo',
        date: new Date(),
        completed: false
      });
    });
    
    expect(result.current.todos).toHaveLength(1);
  });
});
```

#### B. 통합 테스트
```typescript
// __tests__/pages/Calendar.integration.test.tsx
describe('Calendar Integration', () => {
  it('should add todo when date is selected', async () => {
    render(<App />);
    
    const dateCell = screen.getByText('15');
    fireEvent.click(dateCell);
    
    const input = screen.getByPlaceholderText('새 할일을 입력하세요');
    fireEvent.change(input, { target: { value: 'Test Todo' } });
    
    const addButton = screen.getByText('추가');
    fireEvent.click(addButton);
    
    expect(screen.getByText('Test Todo')).toBeInTheDocument();
  });
});
```

## 📈 구현 우선순위

### Phase 1: 기반 구조 개선 (2-3주)
1. **컴포넌트 분할**: 거대한 page.tsx를 작은 컴포넌트들로 분할
2. **타입 시스템**: 중앙집중식 타입 정의 및 인터페이스 통일
3. **커스텀 훅**: 로직 분리를 위한 커스텀 훅 도입
4. **에러 처리**: 기본적인 에러 바운더리 및 예외 처리

### Phase 2: 상태 관리 개선 (2-3주)
1. **Context API**: 전역 상태 관리 도입
2. **서비스 레이어**: 데이터 접근 로직 분리
3. **메모이제이션**: 성능 최적화를 위한 React.memo, useMemo 적용
4. **상태 정규화**: 복잡한 상태 구조 개선

### Phase 3: 사용자 경험 개선 (2-3주)
1. **국제화**: i18n 시스템 도입
2. **테마 시스템**: 개선된 다크모드 지원
3. **접근성**: ARIA 레이블 및 키보드 네비게이션
4. **성능 최적화**: 지연 로딩 및 가상화

### Phase 4: 고급 기능 (2-3주)
1. **테스트**: 포괄적인 테스트 스위트 구축
2. **모니터링**: 에러 추적 및 성능 모니터링
3. **PWA**: 오프라인 지원 및 설치 가능한 앱
4. **고급 최적화**: Bundle 분석 및 최적화

## 📊 예상 효과

### 개발 생산성
- **코드 유지보수성**: 70% 향상
- **디버깅 시간**: 50% 단축
- **새 기능 개발 속도**: 40% 향상

### 사용자 경험
- **초기 로딩 시간**: 30% 단축
- **인터랙션 응답시간**: 50% 향상
- **접근성 점수**: 90점 이상

### 코드 품질
- **테스트 커버리지**: 80% 이상
- **타입 안전성**: 99% TypeScript 커버리지
- **번들 크기**: 25% 감소

이러한 개선사항들을 단계적으로 적용하면 현재의 프로토타입 수준에서 프로덕션 레벨의 안정적이고 확장 가능한 애플리케이션으로 발전시킬 수 있습니다.
