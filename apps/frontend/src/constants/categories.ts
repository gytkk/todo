import { TodoCategory } from '@calendar-todo/shared-types';

export const DEFAULT_CATEGORIES: TodoCategory[] = [
  {
    id: 'personal',
    name: '개인',
    color: '#3b82f6',
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'work',
    name: '회사',
    color: '#10b981',
    createdAt: new Date('2024-01-01')
  },
];

// 사용자 정의 카테고리용 색상 팔레트 (shadcn/ui 기반)
export const CATEGORY_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f97316', // Orange
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#0ea5e9', // Sky
  '#22c55e', // Green
  '#eab308', // Yellow
  '#6366f1', // Indigo
  '#f43f5e', // Rose
  '#14b8a6', // Teal
];

// localStorage keys
export const STORAGE_KEYS = {
  TODOS: 'calendar-todos',
  SETTINGS: 'app-settings',
  CATEGORY_FILTER: 'category-filter',
  USER_CATEGORIES: 'user-categories',
} as const;
