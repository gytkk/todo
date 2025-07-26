"use client";

import React from 'react';
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
  return (
    <div>
      <div className="flex gap-2 flex-wrap">
        {categories.map(category => {
          const isSelected = selectedCategoryId === category.id;

          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onSelectCategory(category.id)}
              disabled={disabled}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${isSelected
                ? 'border-current text-white shadow-sm'
                : 'border-current text-current bg-transparent hover:bg-opacity-10'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
              style={{
                borderColor: category.color,
                backgroundColor: isSelected ? category.color : 'transparent',
                color: isSelected ? 'white' : category.color
              }}
            >
              <div
                className={`w-3 h-3 rounded-full ${isSelected ? 'bg-white' : ''}`}
                style={{
                  backgroundColor: isSelected ? 'white' : category.color
                }}
              />
              {category.name}
            </button>
          );
        })}
      </div>
    </div>
  );
};
