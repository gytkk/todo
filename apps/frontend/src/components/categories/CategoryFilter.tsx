"use client";

import React from 'react';
import { TodoCategory, CategoryFilter as CategoryFilterType } from '@calendar-todo/shared-types';

interface CategoryFilterProps {
  categories: TodoCategory[];
  categoryFilter: CategoryFilterType;
  onToggleCategory: (categoryId: string) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  categoryFilter,
  onToggleCategory
}) => {

  return (
    <div className="p-4 border-t border-gray-200">
      <div className="space-y-2">
        {categories.map(category => {
          const isActive = categoryFilter[category.id] !== false;

          return (
            <label
              key={category.id}
              className={`flex items-center gap-3 py-2 px-3 rounded-lg cursor-pointer transition-all duration-200 ease-in-out border hover:shadow-md active:scale-95 ${isActive
                  ? 'shadow-sm'
                  : 'opacity-60'
                }`}
              style={{
                backgroundColor: isActive ? `${category.color}12` : 'transparent',
                borderColor: isActive ? `${category.color}40` : `${category.color}20`,
              }}
            >
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={() => onToggleCategory(category.id)}
                  className="h-5 w-5 focus:ring-2 focus:ring-offset-2 border-gray-300 rounded appearance-none cursor-pointer flex-shrink-0 transition-all duration-200"
                  style={{
                    backgroundColor: isActive ? category.color : 'transparent',
                    borderColor: category.color,
                    borderWidth: '2px',
                    boxShadow: isActive ? `0 0 0 2px ${category.color}20` : 'none'
                  }}
                />
                {isActive && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <svg
                      className="w-5 h-5 text-white animate-in fade-in-0 zoom-in-50 duration-150"
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
              <div className="flex items-center gap-2 flex-1">
                <span className={`text-sm font-medium transition-all duration-200 ${isActive ? 'text-gray-800' : 'text-gray-500'
                  }`}>
                  {category.name}
                </span>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
};
