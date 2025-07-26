// Settings 관련 타입들을 별도 파일로 분리
export type { UserInfo, Category, AppSettings } from './settings';

// 페이지/네비게이션 관련 타입들
export type PageType = "home" | "statistics" | "settings";

export interface SidebarState {
  expanded: boolean;
  visible: boolean;
}

export interface CalendarState {
  selectedDate: Date | undefined;
  isSidebarOpen: boolean;
}

// API 공통 응답 타입들
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// HTTP 상태 코드 타입
export type HttpStatusCode =
  | 200 | 201 | 204 // Success
  | 400 | 401 | 403 | 404 | 409 | 422 // Client Error
  | 500 | 502 | 503; // Server Error
