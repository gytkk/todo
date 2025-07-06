"use client";

import React from 'react';
import { TodoCategory, CategoryFilter } from '@calendar-todo/shared-types';

interface CategoryFilterProps {
  categories: TodoCategory[];
  categoryFilter: CategoryFilter;
  onToggleCategory: (categoryId: string) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  categoryFilter,
  onToggleCategory
}) => {
  const activeCount = Object.values(categoryFilter).filter(Boolean).length;
  const totalCount = categories.length;

  return (
    <div className="p-4 border-t border-gray-200">
      <div className="mb-3">
        <h3 className="text-sm font-medium text-gray-700">카테고리 필터</h3>
      </div>

      <div className="space-y-2">
        {categories.map(category => {
          const isActive = categoryFilter[category.id] !== false;

          return (
            <label
              key={category.id}
              className={`flex items-center gap-2 p-3 rounded-md cursor-pointer transition-colors ${isActive ? 'bg-gray-50' : 'bg-gray-25 opacity-60'
                } hover:bg-gray-100`}
            >
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={() => onToggleCategory(category.id)}
                  className="h-5 w-5 focus:ring-2 border-gray-300 rounded appearance-none cursor-pointer flex-shrink-0"
                  style={{
                    backgroundColor: isActive ? category.color : 'transparent',
                    borderColor: category.color,
                    borderWidth: '2px'
                  }}
                />
                {isActive && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
              </div>
              <span className={`text-sm ${isActive ? 'text-gray-700' : 'text-gray-400'}`}>
                {category.name}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
};
