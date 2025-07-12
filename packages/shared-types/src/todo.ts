// 기본 Event 타입 정의
export interface Event {
  title?: string;
  allDay?: boolean;
  start?: Date;
  end?: Date;
  resource?: unknown;
}

// Category 관련 타입들
export interface TodoCategory {
  id: string;
  name: string;
  color: string;
  icon?: string;
  createdAt: Date;      // 생성일
}

export interface CategoryFilter {
  [categoryId: string]: boolean;
}

// Todo 관련 타입들
export interface TodoItem {
  id: string;
  title: string;
  date: Date;
  completed: boolean;
  category: TodoCategory; // 카테고리 필드 추가
  userId?: string; // 사용자 인증 추가 시 필요
}

export interface SavedTodoItem {
  id: string;
  title: string;
  date: string; // ISO string for serialization
  completed: boolean;
  category: TodoCategory; // 카테고리 필드 추가
  userId?: string;
}

export interface CalendarEvent extends Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource?: TodoItem;
}

export interface TodoFormData {
  title: string;
}

export interface TodoStats {
  total: number;
  completed: number;
  incomplete: number;
  completionRate: number;
  recentCompletions: number;
}

// API 요청/응답 타입들
export interface CreateTodoRequest {
  title: string;
  date: string; // ISO date string
  category: TodoCategory; // 카테고리 전체 객체 포함
}

export interface CreateTodoResponse {
  todo: TodoItem;
}

export interface UpdateTodoRequest {
  title?: string;
  completed?: boolean;
  date?: string;
  category?: TodoCategory; // 카테고리 전체 객체 포함
}

export interface UpdateTodoResponse {
  todo: TodoItem;
}

export interface GetTodosResponse {
  todos: TodoItem[];
  stats: TodoStats;
}

export interface DeleteTodoResponse {
  success: boolean;
  deletedId: string;
}

// Category Action 타입 (카테고리 삭제 시 사용)
export type CategoryAction = 'deleted' | 'moved' | 'cancelled';
