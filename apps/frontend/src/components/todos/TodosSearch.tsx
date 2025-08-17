"use client";

import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@calendar-todo/ui';

interface TodosSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  placeholder?: string;
  className?: string;
}

function TodosSearchComponent({
  searchQuery,
  onSearchChange,
  placeholder = "할 일 검색...",
  className = '',
}: TodosSearchProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 검색어 클리어
  const clearSearch = useCallback(() => {
    onSearchChange('');
    inputRef.current?.focus();
  }, [onSearchChange]);

  // 키보드 단축키 처리
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + K 또는 Ctrl/Cmd + F로 검색 포커스
      if ((event.ctrlKey || event.metaKey) && (event.key === 'k' || event.key === 'f')) {
        event.preventDefault();
        inputRef.current?.focus();
      }
      
      // ESC로 검색 클리어 및 포커스 해제
      if (event.key === 'Escape' && isFocused) {
        clearSearch();
        inputRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [clearSearch, isFocused]);

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <Search className="h-4 w-4 text-gray-500" />
        <h3 className="font-medium text-gray-900">검색</h3>
      </div>
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={`
            block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md
            placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            transition-colors duration-200
            ${isFocused ? 'bg-white' : 'bg-gray-50'}
          `}
        />
        
        {searchQuery && (
          <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
      
      {isFocused && (
        <div className="mt-2 text-xs text-gray-500">
          <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">Ctrl</kbd>
          {' + '}
          <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">K</kbd>
          {' 로 빠른 검색, '}
          <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">ESC</kbd>
          {' 로 지우기'}
        </div>
      )}
    </div>
  );
}

export const TodosSearch = memo(TodosSearchComponent);