import { TodoCategory } from '@calendar-todo/shared-types';

export const DEFAULT_CATEGORIES: TodoCategory[] = [
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
export const CATEGORY_COLORS = [
  '#ef4444', // 빨간색
  '#8b5cf6', // 보라색
  '#06b6d4', // 하늘색
  '#84cc16', // 라임색
  '#f97316', // 주황색
  '#ec4899', // 핑크색
  '#64748b', // 회색
  '#059669', // 에메랄드색
];

// localStorage keys
export const STORAGE_KEYS = {
  TODOS: 'calendar-todos',
  SETTINGS: 'app-settings',
  CATEGORY_FILTER: 'category-filter',
  USER_CATEGORIES: 'user-categories',
} as const;
