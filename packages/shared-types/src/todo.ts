import { Event } from "react-big-calendar";

// Category 관련 타입들
export interface TodoCategory {
  id: string;
  name: string;
  color: string;
  icon?: string;
  isDefault: boolean;    // 기본 카테고리 여부 (삭제 방지용)
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
  categoryId: string; // 카테고리 ID 추가
}

export interface CreateTodoResponse {
  todo: TodoItem;
}

export interface UpdateTodoRequest {
  title?: string;
  completed?: boolean;
  date?: string;
  categoryId?: string; // 카테고리 변경 지원
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