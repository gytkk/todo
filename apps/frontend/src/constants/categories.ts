import { TodoCategory } from '@calendar-todo/shared-types';

export const DEFAULT_CATEGORIES: TodoCategory[] = [
  {
    id: 'personal',
    name: '개인',
    color: '#3b82f6',
    createdAt: new Date('2024-01-01'),
    order: 0
  },
  {
    id: 'work',
    name: '회사',
    color: '#10b981',
    createdAt: new Date('2024-01-01'),
    order: 1
  },
];

// 사용자 정의 카테고리용 색상 팔레트 (HSL 색상환 순서로 정렬)
export const CATEGORY_COLORS = [
  '#ef4444', // Red (H: 0°)
  '#f97316', // Orange (H: 25°)
  '#eab308', // Yellow (H: 45°)
  '#22c55e', // Light Green (H: 142°)
  '#14b8a6', // Teal (H: 174°)
  '#0ea5e9', // Sky (H: 199°)
  '#3b82f6', // Blue (H: 221°)
  '#6366f1', // Indigo (H: 239°)
  '#8b5cf6', // Purple (H: 262°)
];

// localStorage keys
export const STORAGE_KEYS = {
  TODOS: 'calendar-todos',
  SETTINGS: 'app-settings',
  CATEGORY_FILTER: 'category-filter',
  USER_CATEGORIES: 'user-categories',
} as const;
