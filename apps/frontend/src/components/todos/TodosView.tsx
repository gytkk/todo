"use client";

import { memo } from 'react';
import { Button } from '@calendar-todo/ui';
import { ArrowUpDown, ArrowUp, ArrowDown, List, Grid } from 'lucide-react';
import { SortOption, SortOrder } from '@/hooks/useTodosPage';

interface TodosViewProps {
  // 현재 정렬 상태
  sortOption: SortOption;
  sortOrder: SortOrder;
  
  // 뷰 모드 (향후 확장용)
  viewMode?: 'list' | 'card';
  
  // 통계
  totalCount: number;
  filteredCount: number;
  
  // 업데이트 함수들
  onSortChange: (option: SortOption, order: SortOrder) => void;
  onViewModeChange?: (mode: 'list' | 'card') => void;
  
  // UI
  className?: string;
}

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'date', label: '날짜순' },
  { value: 'category', label: '카테고리순' },
  { value: 'completion', label: '완료 상태순' },
  { value: 'created', label: '생성일순' },
];

function TodosViewComponent({
  sortOption,
  sortOrder,
  viewMode = 'list',
  totalCount,
  filteredCount,
  onSortChange,
  onViewModeChange,
  className = '',
}: TodosViewProps) {
  
  // 정렬 옵션 변경
  const handleSortOptionChange = (newOption: SortOption) => {
    if (newOption === sortOption) {
      // 같은 옵션 클릭 시 정렬 순서 토글
      onSortChange(sortOption, sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // 다른 옵션 클릭 시 기본값은 내림차순
      onSortChange(newOption, 'desc');
    }
  };

  // 정렬 순서 토글
  const toggleSortOrder = () => {
    onSortChange(sortOption, sortOrder === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* 왼쪽: 통계 및 정렬 */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* 통계 */}
          <div className="text-sm text-gray-600">
            {filteredCount !== totalCount ? (
              <span>
                <span className="font-medium">{filteredCount}</span>
                <span className="text-gray-400"> / {totalCount}</span>
              </span>
            ) : (
              <span className="font-medium">{totalCount}개</span>
            )}
          </div>

          {/* 정렬 옵션 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">정렬:</span>
            <div className="flex gap-1">
              {sortOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={sortOption === option.value ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleSortOptionChange(option.value)}
                  className="text-xs"
                >
                  {option.label}
                  {sortOption === option.value && (
                    <span className="ml-1">
                      {sortOrder === 'asc' ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : (
                        <ArrowDown className="h-3 w-3" />
                      )}
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* 오른쪽: 정렬 순서 토글 및 뷰 모드 */}
        <div className="flex items-center gap-2">
          {/* 정렬 순서 토글 */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSortOrder}
            className="flex items-center gap-1"
            title={`${sortOrder === 'asc' ? '오름차순' : '내림차순'} (클릭하여 변경)`}
          >
            <ArrowUpDown className="h-4 w-4" />
            <span className="text-xs">
              {sortOrder === 'asc' ? '오름차순' : '내림차순'}
            </span>
          </Button>

          {/* 뷰 모드 전환 (향후 확장용) */}
          {onViewModeChange && (
            <div className="flex border border-gray-300 rounded">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('list')}
                className="rounded-r-none border-0"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'card' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('card')}
                className="rounded-l-none border-0 border-l border-gray-300"
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 현재 정렬 정보 표시 */}
      <div className="mt-2 text-xs text-gray-500">
        {sortOptions.find(opt => opt.value === sortOption)?.label} · {' '}
        {sortOrder === 'asc' ? '오름차순' : '내림차순'} 정렬
      </div>
    </div>
  );
}

export const TodosView = memo(TodosViewComponent);