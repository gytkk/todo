"use client";

import React from 'react';
import { Badge } from "@calendar-todo/ui";
import { TodoCategory } from '@calendar-todo/shared-types';

interface CategorySelectorProps {
  categories: TodoCategory[];
  selectedCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
  disabled?: boolean;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
  disabled = false
}) => {
  // 색상의 밝기를 계산하여 텍스트 색상 결정
  const getTextColor = (hexColor: string, isSelected: boolean) => {
    if (!isSelected) return hexColor;
    
    // 헥스 색상을 RGB로 변환
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    
    // 밝기 계산 (0-255)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    // 밝기가 128보다 크면 검은색, 작으면 흰색
    return brightness > 128 ? '#000000' : '#ffffff';
  };

  // 선택되지 않은 상태의 배경색 (매우 연한 색상)
  const getLightBackgroundColor = (hexColor: string) => {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    
    // 원래 색상에 투명도를 적용한 효과 (10% 정도)
    return `rgba(${r}, ${g}, ${b}, 0.1)`;
  };

  return (
    <div className="w-full">
      <div 
        className="flex gap-1.5 flex-wrap items-center"
        role="radiogroup"
        aria-label="카테고리 선택"
      >
        {categories.map(category => {
          const isSelected = selectedCategoryId === category.id;
          const textColor = getTextColor(category.color, isSelected);
          const backgroundColor = isSelected 
            ? category.color 
            : getLightBackgroundColor(category.color);

          return (
            <Badge
              key={category.id}
              variant="outline"
              className={`cursor-pointer transition-all duration-200 border-2 px-2.5 py-1.5 text-xs sm:text-sm font-medium hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 min-h-[28px] ${
                disabled ? 'opacity-50 cursor-not-allowed' : ''
              } ${isSelected 
                ? 'shadow-md ring-1 ring-black/5' 
                : 'hover:shadow-sm border-opacity-30'
              }`}
              style={{
                borderColor: category.color,
                backgroundColor: backgroundColor,
                color: textColor,
                '--tw-ring-color': category.color
              } as React.CSSProperties}
              onClick={() => !disabled && onSelectCategory(category.id)}
              role="radio"
              aria-checked={isSelected}
              tabIndex={disabled ? -1 : 0}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
                  e.preventDefault();
                  onSelectCategory(category.id);
                }
                // 화살표 키로 카테고리 간 이동
                else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                  e.preventDefault();
                  const currentIndex = categories.findIndex(cat => cat.id === category.id);
                  let nextIndex;
                  
                  if (e.key === 'ArrowLeft') {
                    nextIndex = currentIndex > 0 ? currentIndex - 1 : categories.length - 1;
                  } else {
                    nextIndex = currentIndex < categories.length - 1 ? currentIndex + 1 : 0;
                  }
                  
                  onSelectCategory(categories[nextIndex].id);
                  
                  // 포커스를 다음 요소로 이동
                  setTimeout(() => {
                    const nextElement = e.currentTarget.parentElement?.children[nextIndex] as HTMLElement;
                    nextElement?.focus();
                  }, 0);
                }
              }}
            >
              <div
                className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full mr-1.5 flex-shrink-0"
                style={{
                  backgroundColor: isSelected ? textColor : category.color
                }}
              />
              <span className="truncate max-w-[80px] sm:max-w-none">
                {category.name}
              </span>
            </Badge>
          );
        })}
      </div>
    </div>
  );
};
