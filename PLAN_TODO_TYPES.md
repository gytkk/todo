# 할 일 타입 분리 기능 구현 계획

## 🎯 목표 기능

- **이벤트 (Event)**: 특정 날짜에 고정되어 있으며, 날짜가 지나도 해당 날짜에 그대로 유지 (약속, 회의, 기념일 등)
- **작업 (Task)**: 생성된 날짜부터 시작하여, 미완료 상태로 날짜가 지나가면 다음 날로 자동 이동 (할 일, 업무 등)

## 🏗️ 현재 시스템 분석

### 백엔드 구조

- **NestJS + Redis**: `TodoEntity`에 이미 `createdAt`, `dueDate`, `updatedAt` 필드 존재
- **UserScopedRedisRepository**: 사용자별 데이터 격리
- **표준 CRUD API**: 날짜 범위 조회, 카테고리별 필터링 지원

### 프론트엔드 구조

- **Next.js 15 + React 19**: App Router 사용
- **Custom Calendar**: 월간/일간 뷰 구현
- **TodoForm**: 현재는 title과 category만 입력

### 데이터 타입

- **shared-types**: `TodoItem` 인터페이스로 프론트엔드-백엔드 타입 공유

## 📋 단계별 구현 계획

### Phase 1: 데이터 모델 확장 (1-2일)

#### 1.1 공유 타입 업데이트

- `packages/shared-types/src/todo.ts` 수정:

  ```typescript
  export type TodoType = 'event' | 'task';
  
  export interface TodoItem {
    // ... 기존 필드들
    todoType: TodoType;
  }
  
  export interface CreateTodoRequest {
    // ... 기존 필드들
    todoType: TodoType;
  }
  
  export interface UpdateTodoRequest {
    // ... 기존 필드들
    todoType?: TodoType;
  }
  ```

#### 1.2 백엔드 엔티티 업데이트

- `apps/backend/src/todos/todo.entity.ts` 수정:

  ```typescript
  export class TodoEntity {
    // ... 기존 필드들
    todoType: 'event' | 'task';
    
    constructor(data: Partial<TodoEntity>) {
      // ... 기존 코드
      this.todoType = data.todoType || 'event'; // 기본값 설정
    }
  }
  ```

#### 1.3 DTO 업데이트

- `apps/backend/src/todos/dto/create-todo.dto.ts`
- `apps/backend/src/todos/dto/update-todo.dto.ts`
- `todoType` 필드 추가

#### 1.4 Repository 직렬화 업데이트

- `todo.repository.ts`의 `serialize/deserialize` 메서드에 `todoType` 필드 추가

### Phase 2: 기본 UI 구현 (2-3일)

#### 2.1 TodoForm 업데이트

- `apps/frontend/src/components/todo/TodoForm.tsx` 수정:
  - 할 일 타입 선택 UI 추가 (라디오 버튼 또는 토글)
  - "📅 이벤트" vs "📝 작업" 옵션
  - 기본값: 'event'

#### 2.2 할 일 표시 업데이트

- `apps/frontend/src/components/todo/TodoItem.tsx` 수정:
  - 타입별 아이콘 표시 (📅 이벤트, 📝 작업)
  - 색상이나 스타일로 시각적 구분

#### 2.3 캘린더 뷰 업데이트

- 월간 뷰에서 할 일 타입별 구분 표시
- 일간 뷰에서 상세 정보 표시

#### 2.4 기존 데이터 호환성

- 기존 모든 할 일을 자동으로 'event' 타입으로 설정
- 마이그레이션 로직 (백엔드에서 처리)

### Phase 3: 이동 로직 구현 (3-4일)

#### 3.1 백엔드 서비스 로직

- `apps/backend/src/todos/todo.service.ts`에 새 메서드 추가:

  ```typescript
  async moveTasksToNextDay(userId: string): Promise<number> {
    // 오늘 이전 날짜의 미완료 작업들을 오늘로 이동
  }
  
  async getTasksDueForMove(userId: string): Promise<TodoEntity[]> {
    // 이동이 필요한 작업들 조회
  }
  ```

#### 3.2 새 API 엔드포인트

- `POST /todos/move-tasks`: 수동으로 작업들 이동 트리거
- `GET /todos/tasks-due`: 이동 대상 작업들 조회

#### 3.3 이동 로직 세부사항

- **이동 조건**:
  - `todoType === 'task'`
  - `completed === false`
  - `dueDate < 오늘 날짜`
- **이동 처리**:
  - `dueDate`를 오늘 날짜로 업데이트
  - `updatedAt` 업데이트
- **완료된 할 일**: 이동하지 않음

#### 3.4 프론트엔드 통합

- 사용자 로그인/앱 접속 시 자동으로 이동 API 호출
- 이동된 할 일 개수 표시 (옵션)

### Phase 4: 고급 기능 및 개선사항 (2-3일)

#### 4.1 사용자 설정 추가

- `apps/frontend/src/components/settings/` 에 새 설정 추가:
  - 작업 자동 이동 활성화/비활성화
  - 이동 알림 표시 여부

#### 4.2 통계 기능 개선

- `apps/backend/src/todos/todo.service.ts`의 `getStats` 메서드:
  - 타입별 할 일 통계
  - 이동 횟수 추적

#### 4.3 사용자 경험 개선

- 작업이 이동될 때 토스트 알림
- 할 일 상세 정보에 원래 생성 날짜 표시
- 이동 히스토리 (선택사항)

## 🔧 핵심 구현 세부사항

### 데이터베이스 스키마 변경

```typescript
// 기존 TodoEntity에 추가될 필드
todoType: 'event' | 'task' = 'event'
```

### 이동 알고리즘

```typescript
// 의사 코드
function moveTasks(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todosToMove = await findTodos({
    userId,
    todoType: 'task',
    completed: false,
    dueDate: { $lt: today }
  });
  
  for (const todo of todosToMove) {
    todo.dueDate = today;
    todo.updatedAt = new Date();
    await updateTodo(todo);
  }
  
  return todosToMove.length;
}
```

### UI 컴포넌트 구조

```tsx
// TodoForm에 추가될 UI
<div className="flex items-center space-x-4">
  <label className="flex items-center">
    <input type="radio" value="event" checked={todoType === 'event'} />
    <span>📅 이벤트</span>
  </label>
  <label className="flex items-center">
    <input type="radio" value="task" checked={todoType === 'task'} />
    <span>📝 작업</span>
  </label>
</div>
```

## ⚠️ 주요 고려사항

### 1. 데이터 일관성

- 기존 할 일들의 기본 타입을 'event'로 설정하여 호환성 유지
- 마이그레이션 시 데이터 손실 방지

### 2. 성능 최적화

- 이동 로직이 대량의 할 일을 처리할 때 성능 이슈 방지
- 배치 처리 및 인덱싱 최적화

### 3. 사용자 경험

- 작업의 동작 방식을 사용자가 명확히 이해할 수 있도록
- 온보딩 또는 도움말 제공 고려

### 4. 이동 시점 결정

- **권장**: 사용자 로그인 시 이동 (서버 부하 적고, 사용자 인지 가능)
- **대안**: 자정에 자동 이동 (크론 작업 필요)

### 5. 잠재적 문제점

- 작업이 계속 미완료로 무한 이동하는 경우
- 사용자가 의도치 않게 작업으로 설정한 경우 해결 방안
- 캘린더 뷰에서 이동 히스토리 표시 방법

## 📅 타임라인

| Phase | 기간 | 주요 작업 | 결과물 |
|-------|------|----------|--------|
| Phase 1 | 1-2일 | 데이터 모델 확장 | 타입 정의, 엔티티 업데이트 |
| Phase 2 | 2-3일 | 기본 UI 구현 | 할 일 생성/표시 UI |
| Phase 3 | 3-4일 | 이동 로직 구현 | 자동 이동 기능 |
| Phase 4 | 2-3일 | 고급 기능 | 설정, 통계, UX 개선 |

**전체 예상 소요 시간: 8-12일**

## 🚀 시작 방법

1. **Phase 1부터 순차적으로 시작**
2. **각 Phase 완료 후 테스트 및 검증**
3. **사용자 피드백을 받아 다음 Phase 조정**
4. **필요시 Phase 4는 추후에 구현 가능**

## 📝 체크리스트

### Phase 1 완료 조건

- [ ] `TodoType` enum 정의 완료
- [ ] `TodoItem` 인터페이스 업데이트
- [ ] `TodoEntity` 클래스 업데이트
- [ ] DTO 클래스들 업데이트
- [ ] Repository serialize/deserialize 업데이트
- [ ] 기존 데이터 마이그레이션 테스트

### Phase 2 완료 조건

- [ ] `TodoForm`에 타입 선택 UI 추가
- [ ] `TodoItem` 컴포넌트에 타입 표시 추가
- [ ] 캘린더 뷰에서 타입별 구분 표시
- [ ] 기본값 'event' 설정 확인

### Phase 3 완료 조건

- [ ] 이동 로직 서비스 메서드 구현
- [ ] 이동 API 엔드포인트 구현
- [ ] 프론트엔드에서 자동 이동 호출 구현
- [ ] 이동 기능 테스트 완료

### Phase 4 완료 조건

- [ ] 사용자 설정 페이지 업데이트
- [ ] 통계 기능 타입별 분석 추가
- [ ] 사용자 알림 및 피드백 구현
- [ ] 전체 기능 통합 테스트 완료

---

**작성일**: 2025-07-27  
**작성자**: Claude Code  
**프로젝트**: Korean Calendar Todo Application
