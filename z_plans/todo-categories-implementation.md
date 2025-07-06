# Todo Categories (할일 카테고리) 구현 계획

## Overview
사용자의 할일을 '회사', '가족', '개인' 등 여러 카테고리로 분류하고, 왼쪽 사이드바에서 선택한 카테고리의 할일만 캘린더에 표시하는 기능을 구현합니다.

## Requirements Analysis

### 핵심 기능
- [ ] 기본 제공 카테고리: 회사, 가족, 개인
- [ ] 사용자 정의 카테고리 추가/삭제 (설정에서만)
- [ ] 왼쪽 사이드바 하단에 카테고리 필터 UI
- [ ] 체크박스로 카테고리 on/off 제어
- [ ] 선택된 카테고리의 할일만 캘린더에 표시
- [ ] 할일 생성 시 카테고리 선택
- [ ] 각 카테고리별 색상 구분
- [ ] 설정 페이지에서 카테고리 관리

### 확장 기능 (향후)
- [ ] 카테고리별 통계
- [ ] 카테고리별 색상 커스터마이징
- [ ] 카테고리 순서 변경
- [ ] 카테고리 아이콘 설정

## Technical Implementation Plan

### 1. Data Structure (데이터 구조)

#### TodoItem 확장
```typescript
interface TodoItem {
  id: string;
  title: string;
  date: Date;
  completed: boolean;
  category: TodoCategory; // 새로 추가
}

interface TodoCategory {
  id: string;
  name: string;
  color: string;
  icon?: string;
  isDefault: boolean;    // 기본 카테고리 여부 (삭제 방지용)
  createdAt: Date;      // 생성일
}

// 기본 제공 카테고리 (삭제 불가)
const DEFAULT_CATEGORIES: TodoCategory[] = [
  { 
    id: 'work', 
    name: '회사', 
    color: '#3b82f6', 
    isDefault: true,
    createdAt: new Date('2024-01-01')
  },
  { 
    id: 'family', 
    name: '가족', 
    color: '#10b981', 
    isDefault: true,
    createdAt: new Date('2024-01-01')
  },
  { 
    id: 'personal', 
    name: '개인', 
    color: '#f59e0b', 
    isDefault: true,
    createdAt: new Date('2024-01-01')
  },
];

// 사용자 정의 카테고리용 색상 팔레트
const CATEGORY_COLORS = [
  '#ef4444', // 빨간색
  '#8b5cf6', // 보라색
  '#06b6d4', // 하늘색
  '#84cc16', // 라임색
  '#f97316', // 주황색
  '#ec4899', // 핑크색
  '#64748b', // 회색
  '#059669', // 에메랄드색
];
```

#### Category Filter State
```typescript
interface CategoryFilter {
  [categoryId: string]: boolean;
}

// 기본 상태 (모든 카테고리 선택)
const defaultCategoryFilter: CategoryFilter = {
  work: true,
  family: true,
  personal: true,
};
```

### 2. State Management (상태 관리)

#### Context 확장
```typescript
interface AppContextType {
  // 기존 Todo 관련
  todos: TodoItem[];
  addTodo: (title: string, date: Date, categoryId: string) => void;
  deleteTodo: (id: string) => void;
  
  // 새로운 Category 관련
  categories: TodoCategory[];
  categoryFilter: CategoryFilter;
  setCategoryFilter: (filter: CategoryFilter) => void;
  toggleCategoryFilter: (categoryId: string) => void;
  getFilteredTodos: () => TodoItem[];
  getTodosByDateAndCategory: (date: Date) => TodoItem[];
  
  // 카테고리 관리 (설정에서만 사용)
  addCategory: (name: string, color: string) => TodoCategory;
  updateCategory: (id: string, updates: Partial<TodoCategory>) => void;
  deleteCategory: (id: string) => boolean; // 기본 카테고리는 삭제 불가
  getCategoryById: (id: string) => TodoCategory | undefined;
  getAvailableColors: () => string[]; // 사용되지 않은 색상 반환
}
```

#### Hooks 확장
```typescript
// useCategories.ts
export const useCategories = () => {
  // localStorage에서 카테고리 로드 (기본 카테고리 + 사용자 정의)
  const [categories, setCategories] = useState<TodoCategory[]>(() => {
    const stored = localStorage.getItem('user-categories');
    const userCategories = stored ? JSON.parse(stored) : [];
    return [...DEFAULT_CATEGORIES, ...userCategories];
  });

  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>(() => {
    const stored = localStorage.getItem('category-filter');
    const defaultFilter = categories.reduce((acc, cat) => ({
      ...acc,
      [cat.id]: true
    }), {});
    return stored ? JSON.parse(stored) : defaultFilter;
  });

  // 카테고리 추가
  const addCategory = useCallback((name: string, color: string) => {
    const newCategory: TodoCategory = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      color,
      isDefault: false,
      createdAt: new Date()
    };

    setCategories(prev => {
      const updated = [...prev, newCategory];
      // 사용자 정의 카테고리만 저장
      const userCategories = updated.filter(cat => !cat.isDefault);
      localStorage.setItem('user-categories', JSON.stringify(userCategories));
      return updated;
    });

    // 새 카테고리는 기본적으로 필터에 포함
    setCategoryFilter(prev => ({
      ...prev,
      [newCategory.id]: true
    }));

    return newCategory;
  }, []);

  // 카테고리 수정
  const updateCategory = useCallback((id: string, updates: Partial<TodoCategory>) => {
    setCategories(prev => {
      const updated = prev.map(cat => 
        cat.id === id ? { ...cat, ...updates } : cat
      );
      // 사용자 정의 카테고리만 저장
      const userCategories = updated.filter(cat => !cat.isDefault);
      localStorage.setItem('user-categories', JSON.stringify(userCategories));
      return updated;
    });
  }, []);

  // 카테고리 삭제
  const deleteCategory = useCallback((id: string, todos: TodoItem[]): boolean => {
    const category = categories.find(cat => cat.id === id);
    
    // 기본 카테고리는 삭제 불가
    if (!category || category.isDefault) {
      return false;
    }

    // 해당 카테고리를 사용하는 할일이 있는지 확인
    const hasRelatedTodos = todos.some(todo => todo.category.id === id);
    if (hasRelatedTodos) {
      // 사용자에게 알림 후 다른 카테고리로 이동하거나 삭제 확인 필요
      return false;
    }

    setCategories(prev => {
      const updated = prev.filter(cat => cat.id !== id);
      // 사용자 정의 카테고리만 저장
      const userCategories = updated.filter(cat => !cat.isDefault);
      localStorage.setItem('user-categories', JSON.stringify(userCategories));
      return updated;
    });

    // 필터에서도 제거
    setCategoryFilter(prev => {
      const { [id]: removed, ...rest } = prev;
      return rest;
    });

    return true;
  }, [categories]);

  // 사용 가능한 색상 반환 (이미 사용된 색상 제외)
  const getAvailableColors = useCallback(() => {
    const usedColors = categories.map(cat => cat.color);
    return CATEGORY_COLORS.filter(color => !usedColors.includes(color));
  }, [categories]);

  const toggleCategoryFilter = useCallback((categoryId: string) => {
    setCategoryFilter(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  }, []);

  const getFilteredTodos = useCallback((todos: TodoItem[]) => {
    return todos.filter(todo => categoryFilter[todo.category.id]);
  }, [categoryFilter]);

  const getCategoryById = useCallback((id: string) => {
    return categories.find(cat => cat.id === id);
  }, [categories]);

  // categoryFilter 변경 시 localStorage에 저장
  useEffect(() => {
    localStorage.setItem('category-filter', JSON.stringify(categoryFilter));
  }, [categoryFilter]);

  return {
    categories,
    categoryFilter,
    setCategoryFilter,
    toggleCategoryFilter,
    getFilteredTodos,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    getAvailableColors,
  };
};
```

### 3. UI Components (UI 컴포넌트)

#### CategoryManagement Component (설정 페이지용)
```typescript
// components/settings/CategoryManagement.tsx
interface CategoryManagementProps {
  categories: TodoCategory[];
  todos: TodoItem[];
  onAddCategory: (name: string, color: string) => void;
  onUpdateCategory: (id: string, updates: Partial<TodoCategory>) => void;
  onDeleteCategory: (id: string) => boolean;
  getAvailableColors: () => string[];
}

export const CategoryManagement: React.FC<CategoryManagementProps> = ({
  categories,
  todos,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  getAvailableColors
}) => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const availableColors = getAvailableColors();

  const handleAddCategory = () => {
    if (newCategoryName.trim() && selectedColor) {
      onAddCategory(newCategoryName.trim(), selectedColor);
      setNewCategoryName('');
      setSelectedColor('');
    }
  };

  const handleDeleteCategory = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    const relatedTodos = todos.filter(todo => todo.category.id === categoryId);
    
    if (relatedTodos.length > 0) {
      const confirmed = window.confirm(
        `"${category?.name}" 카테고리에 ${relatedTodos.length}개의 할일이 있습니다. 정말 삭제하시겠습니까? 관련된 할일도 함께 삭제됩니다.`
      );
      if (!confirmed) return;
    }
    
    const success = onDeleteCategory(categoryId);
    if (!success) {
      alert('기본 카테고리는 삭제할 수 없습니다.');
    }
  };

  const startEdit = (category: TodoCategory) => {
    setEditingCategory(category.id);
    setEditName(category.name);
  };

  const saveEdit = () => {
    if (editingCategory && editName.trim()) {
      onUpdateCategory(editingCategory, { name: editName.trim() });
      setEditingCategory(null);
      setEditName('');
    }
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setEditName('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">카테고리 관리</h3>
        
        {/* 카테고리 목록 */}
        <div className="space-y-3 mb-6">
          {categories.map(category => (
            <div 
              key={category.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                {editingCategory === category.id ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                    autoFocus
                  />
                ) : (
                  <span className="font-medium">{category.name}</span>
                )}
                {category.isDefault && (
                  <Badge variant="secondary" className="text-xs">기본</Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {editingCategory === category.id ? (
                  <>
                    <Button size="sm" onClick={saveEdit}>저장</Button>
                    <Button size="sm" variant="outline" onClick={cancelEdit}>취소</Button>
                  </>
                ) : (
                  <>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => startEdit(category)}
                      disabled={category.isDefault}
                    >
                      수정
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleDeleteCategory(category.id)}
                      disabled={category.isDefault}
                    >
                      삭제
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* 새 카테고리 추가 */}
        <div className="border-t pt-4">
          <h4 className="font-medium mb-3">새 카테고리 추가</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                카테고리 이름
              </label>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="카테고리 이름을 입력하세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                maxLength={20}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                색상 선택
              </label>
              <div className="flex gap-2 flex-wrap">
                {availableColors.map(color => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      selectedColor === color 
                        ? 'border-gray-800 scale-110' 
                        : 'border-gray-300 hover:border-gray-500'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              {availableColors.length === 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  사용 가능한 색상이 없습니다. 기존 카테고리를 삭제해주세요.
                </p>
              )}
            </div>
            
            <Button 
              onClick={handleAddCategory}
              disabled={!newCategoryName.trim() || !selectedColor || availableColors.length === 0}
              className="w-full"
            >
              카테고리 추가
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
```

#### CategoryFilter Component
```typescript
// components/categories/CategoryFilter.tsx
interface CategoryFilterProps {
  categories: TodoCategory[];
  categoryFilter: CategoryFilter;
  onToggleCategory: (categoryId: string) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  categoryFilter,
  onToggleCategory
}) => {
  return (
    <div className="p-4 border-t border-gray-200">
      <h3 className="text-sm font-medium text-gray-700 mb-3">카테고리 필터</h3>
      <div className="space-y-2">
        {categories.map(category => (
          <label key={category.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={categoryFilter[category.id]}
              onChange={() => onToggleCategory(category.id)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: category.color }}
            />
            <span className="text-sm text-gray-700">{category.name}</span>
          </label>
        ))}
      </div>
    </div>
  );
};
```

#### CategorySelector Component (할일 생성용)
```typescript
// components/categories/CategorySelector.tsx
interface CategorySelectorProps {
  categories: TodoCategory[];
  selectedCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory
}) => {
  return (
    <div className="flex gap-2">
      {categories.map(category => (
        <button
          key={category.id}
          onClick={() => onSelectCategory(category.id)}
          className={`px-3 py-1 rounded-full text-xs font-medium border-2 transition-colors ${
            selectedCategoryId === category.id
              ? 'border-current bg-current text-white'
              : 'border-current text-current bg-transparent'
          }`}
          style={{ 
            borderColor: category.color,
            backgroundColor: selectedCategoryId === category.id ? category.color : 'transparent',
            color: selectedCategoryId === category.id ? 'white' : category.color
          }}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
};
```

### 4. Calendar Integration (캘린더 통합)

#### 필터링된 할일 표시
```typescript
// Calendar에서 필터링된 할일만 표시
const filteredTodos = useMemo(() => {
  return getFilteredTodos(todos);
}, [todos, categoryFilter]);

// CalendarView에 전달
<CalendarView
  currentDate={currentDate}
  selectedDate={selectedDate}
  todos={filteredTodos} // 필터링된 할일만 전달
  onDateSelect={handleDateSelect}
  onNavigate={handleNavigate}
/>
```

#### 카테고리별 시각적 구분
```typescript
// CalendarTodos.tsx에서 카테고리 색상 적용
<div
  className="text-xs px-1.5 py-0.5 rounded-sm truncate"
  style={{
    backgroundColor: todo.completed ? '#f3f4f6' : `${todo.category.color}20`,
    borderLeft: `3px solid ${todo.category.color}`,
    color: todo.completed ? '#6b7280' : '#374151'
  }}
>
  {todo.title}
</div>
```

### 5. TodoForm Enhancement (할일 생성 폼 개선)

#### 카테고리 선택 추가
```typescript
// TodoForm.tsx 확장
const TodoForm: React.FC<TodoFormProps> = ({ onAddTodo, disabled }) => {
  const [title, setTitle] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('personal');
  const { categories } = useAppContext();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onAddTodo(title.trim(), selectedCategoryId);
      setTitle('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="새 할일을 입력하세요..."
        className="w-full p-2 border border-gray-300 rounded-lg"
        disabled={disabled}
      />
      <CategorySelector
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={setSelectedCategoryId}
      />
      <button
        type="submit"
        disabled={disabled || !title.trim()}
        className="w-full bg-blue-500 text-white p-2 rounded-lg disabled:opacity-50"
      >
        추가
      </button>
    </form>
  );
};
```

### 6. Storage (저장소)

#### LocalStorage 확장
```typescript
// localStorage keys
const STORAGE_KEYS = {
  TODOS: 'calendar-todos',
  SETTINGS: 'app-settings',
  CATEGORY_FILTER: 'category-filter',
  USER_CATEGORIES: 'user-categories', // 사용자 정의 카테고리
} as const;

// 카테고리 필터 저장/로드
const saveCategoryFilter = (filter: CategoryFilter) => {
  localStorage.setItem(STORAGE_KEYS.CATEGORY_FILTER, JSON.stringify(filter));
};

const loadCategoryFilter = (): CategoryFilter => {
  const stored = localStorage.getItem(STORAGE_KEYS.CATEGORY_FILTER);
  return stored ? JSON.parse(stored) : defaultCategoryFilter;
};

// 사용자 정의 카테고리 저장/로드
const saveUserCategories = (categories: TodoCategory[]) => {
  const userCategories = categories.filter(cat => !cat.isDefault);
  localStorage.setItem(STORAGE_KEYS.USER_CATEGORIES, JSON.stringify(userCategories));
};

const loadUserCategories = (): TodoCategory[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.USER_CATEGORIES);
  return stored ? JSON.parse(stored) : [];
};

const loadAllCategories = (): TodoCategory[] => {
  const userCategories = loadUserCategories();
  return [...DEFAULT_CATEGORIES, ...userCategories];
};
```

### 7. Migration Strategy (마이그레이션 전략)

#### 기존 데이터 마이그레이션
```typescript
// 기존 할일에 기본 카테고리 할당
const migrateTodos = (todos: TodoItem[]): TodoItem[] => {
  return todos.map(todo => ({
    ...todo,
    category: todo.category || DEFAULT_CATEGORIES[2] // '개인' 카테고리 기본값
  }));
};

// 삭제된 카테고리를 사용하는 할일들을 기본 카테고리로 이동
const migrateOrphanedTodos = (todos: TodoItem[], availableCategories: TodoCategory[]): TodoItem[] => {
  const availableCategoryIds = availableCategories.map(cat => cat.id);
  
  return todos.map(todo => {
    if (!availableCategoryIds.includes(todo.category.id)) {
      console.warn(`Todo "${todo.title}" has invalid category, migrating to personal category`);
      return {
        ...todo,
        category: DEFAULT_CATEGORIES[2] // '개인' 카테고리로 이동
      };
    }
    return todo;
  });
};

// 카테고리 삭제 시 관련 할일 처리
const handleCategoryDeletion = (
  categoryId: string, 
  todos: TodoItem[], 
  onDeleteTodos: (ids: string[]) => void,
  fallbackCategoryId: string = 'personal'
): 'deleted' | 'moved' | 'cancelled' => {
  const relatedTodos = todos.filter(todo => todo.category.id === categoryId);
  
  if (relatedTodos.length === 0) {
    return 'deleted';
  }
  
  const action = window.confirm(
    `"${categoryId}" 카테고리에 ${relatedTodos.length}개의 할일이 있습니다.\n\n` +
    `"확인"을 누르면 할일들이 "${fallbackCategoryId}" 카테고리로 이동됩니다.\n` +
    `"취소"를 누르면 카테고리 삭제가 취소됩니다.`
  );
  
  if (!action) {
    return 'cancelled';
  }
  
  // 할일들을 다른 카테고리로 이동
  const fallbackCategory = DEFAULT_CATEGORIES.find(cat => cat.id === fallbackCategoryId);
  if (fallbackCategory) {
    relatedTodos.forEach(todo => {
      todo.category = fallbackCategory;
    });
  }
  
  return 'moved';
};
```

## Implementation Steps (구현 단계)

### Phase 1: Data Structure & State Management
- [ ] TodoItem 인터페이스에 category 필드 추가
- [ ] TodoCategory 인터페이스 정의 (isDefault, createdAt 포함)
- [ ] 기본 카테고리 및 색상 팔레트 정의
- [ ] useCategories 훅 구현 (CRUD 기능 포함)
- [ ] AppContext에 카테고리 관련 상태 추가

### Phase 2: Settings Page Integration
- [ ] CategoryManagement 컴포넌트 구현
- [ ] 설정 페이지에 카테고리 관리 섹션 추가
- [ ] 카테고리 추가/수정/삭제 기능 구현
- [ ] 색상 선택 UI 구현

### Phase 3: UI Components (Sidebar & Form)
- [ ] CategoryFilter 컴포넌트 구현
- [ ] CategorySelector 컴포넌트 구현
- [ ] 왼쪽 사이드바에 CategoryFilter 추가
- [ ] TodoForm에 카테고리 선택 기능 추가

### Phase 4: Calendar Integration
- [ ] 필터링된 할일만 캘린더에 표시
- [ ] 카테고리별 색상 구분 시각화
- [ ] CalendarTodos 컴포넌트 업데이트
- [ ] 카테고리별 할일 개수 표시

### Phase 5: Data Management
- [ ] 사용자 정의 카테고리 localStorage 저장
- [ ] 카테고리 필터 상태 저장
- [ ] 기존 할일 데이터 마이그레이션
- [ ] 카테고리 삭제 시 할일 처리 로직

### Phase 6: Error Handling & Validation
- [ ] 카테고리 이름 중복 검사
- [ ] 최대 카테고리 개수 제한 (색상 팔레트 크기)
- [ ] 삭제된 카테고리 참조 정리
- [ ] 데이터 무결성 검증

### Phase 7: Testing & Polish
- [ ] 카테고리 CRUD 테스트
- [ ] 필터링 로직 테스트
- [ ] UI/UX 개선
- [ ] 성능 최적화

## File Structure (파일 구조)

```
src/
├── types/
│   └── categories.ts           # 카테고리 관련 타입 정의
├── hooks/
│   └── useCategories.ts        # 카테고리 상태 관리 훅 (CRUD 포함)
├── components/
│   ├── categories/
│   │   ├── CategoryFilter.tsx  # 카테고리 필터 컴포넌트 (사이드바용)
│   │   └── CategorySelector.tsx # 카테고리 선택 컴포넌트 (할일 생성용)
│   ├── settings/
│   │   └── CategoryManagement.tsx # 카테고리 관리 컴포넌트 (설정페이지용)
│   ├── sidebar/
│   │   └── Sidebar.tsx         # 업데이트된 사이드바 (필터 포함)
│   └── todo/
│       └── TodoForm.tsx        # 업데이트된 할일 폼 (카테고리 선택 포함)
├── utils/
│   ├── categoryUtils.ts        # 카테고리 관련 유틸리티
│   └── migrationUtils.ts       # 데이터 마이그레이션 유틸리티
└── constants/
    └── categories.ts           # 기본 카테고리 및 색상 팔레트 정의
```

## Design Considerations (디자인 고려사항)

### 색상 시스템
- **회사**: 파란색 (`#3b82f6`) - 전문성, 신뢰성
- **가족**: 초록색 (`#10b981`) - 성장, 조화
- **개인**: 주황색 (`#f59e0b`) - 활력, 개성

### UX 원칙
1. **명확성**: 각 할일이 어떤 카테고리인지 한눈에 파악 가능
2. **일관성**: 모든 화면에서 동일한 색상과 표기법 사용
3. **효율성**: 최소한의 클릭으로 카테고리 필터링 가능
4. **접근성**: 색상뿐만 아니라 텍스트로도 구분 가능

### 성능 고려사항
- 필터링 로직 최적화 (useMemo 활용)
- 대량의 할일 데이터 처리 시 가상화 고려
- 카테고리 변경 시 불필요한 리렌더링 방지

## Success Criteria (성공 기준)

- [ ] 사용자가 카테고리별로 할일을 구분하여 생성할 수 있음
- [ ] 설정 페이지에서 사용자 정의 카테고리 추가/수정/삭제 가능
- [ ] 왼쪽 사이드바에서 체크박스로 카테고리 필터링 가능
- [ ] 선택된 카테고리의 할일만 캘린더에 표시됨
- [ ] 각 카테고리별로 시각적 구분이 명확함
- [ ] 기본 카테고리는 삭제할 수 없음
- [ ] 카테고리 삭제 시 관련 할일 처리가 안전하게 이루어짐
- [ ] 기존 할일 데이터가 손실 없이 마이그레이션됨
- [ ] 카테고리 및 필터 상태가 새로고침 후에도 유지됨
- [ ] 사용 가능한 색상이 효율적으로 관리됨

## Future Enhancements (향후 개선사항)

- 카테고리별 할일 통계 대시보드
- 카테고리 우선순위 설정 및 정렬
- 카테고리별 알림 설정
- 카테고리 간 할일 이동 기능 (드래그앤드롭)
- 카테고리별 템플릿 할일 저장
- 카테고리별 색상 커스터마이징 (색상 팔레트 확장)
- 카테고리 아이콘 설정
- 카테고리별 할일 목표 설정
- 카테고리별 진행률 표시