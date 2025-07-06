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

export type CategoryAction = 'deleted' | 'moved' | 'cancelled';