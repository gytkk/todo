"use client";

import React, { useState } from 'react';
import { Button, Badge } from "@calendar-todo/ui";
import { TodoCategory, TodoItem } from '@calendar-todo/shared-types';

interface CategoryManagementProps {
  categories: TodoCategory[];
  todos: TodoItem[];
  onAddCategory: (name: string, color: string) => TodoCategory;
  onUpdateCategory: (id: string, updates: Partial<TodoCategory>) => void;
  onDeleteCategory: (id: string, todos: TodoItem[]) => boolean;
  getAvailableColors: () => string[];
}

export const CategoryManagement: React.FC<CategoryManagementProps> = ({
  categories,
  todos,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  getAvailableColors
}) => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const availableColors = getAvailableColors();

  const handleAddCategory = () => {
    if (newCategoryName.trim() && selectedColor) {
      // 중복 이름 체크
      const nameExists = categories.some(cat =>
        cat.name.toLowerCase() === newCategoryName.trim().toLowerCase()
      );

      if (nameExists) {
        alert('이미 존재하는 카테고리 이름입니다.');
        return;
      }

      onAddCategory(newCategoryName.trim(), selectedColor);
      setNewCategoryName('');
      setSelectedColor('');
    }
  };

  const handleDeleteCategory = (categoryId: string) => {
    const success = onDeleteCategory(categoryId, todos);
    if (!success) {
      const category = categories.find(cat => cat.id === categoryId);
      if (category?.isDefault) {
        alert('기본 카테고리는 삭제할 수 없습니다.');
      }
    }
  };

  const startEdit = (category: TodoCategory) => {
    setEditingCategory(category.id);
    setEditName(category.name);
  };

  const saveEdit = () => {
    if (editingCategory && editName.trim()) {
      // 중복 이름 체크 (현재 편집 중인 카테고리 제외)
      const nameExists = categories.some(cat =>
        cat.id !== editingCategory &&
        cat.name.toLowerCase() === editName.trim().toLowerCase()
      );

      if (nameExists) {
        alert('이미 존재하는 카테고리 이름입니다.');
        return;
      }

      onUpdateCategory(editingCategory, { name: editName.trim() });
      setEditingCategory(null);
      setEditName('');
    }
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setEditName('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">카테고리 관리</h3>

        {/* 카테고리 목록 */}
        <div className="space-y-3 mb-6">
          {categories.map(category => {
            const relatedTodos = todos.filter(todo => todo.category?.id === category.id);

            return (
              <div
                key={category.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: category.color }}
                  />
                  {editingCategory === category.id ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                      autoFocus
                      maxLength={20}
                    />
                  ) : (
                    <span className="font-medium">{category.name}</span>
                  )}
                  {category.isDefault && (
                    <Badge variant="secondary" className="text-xs">기본</Badge>
                  )}
                  {relatedTodos.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {relatedTodos.length}개 할일
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {editingCategory === category.id ? (
                    <>
                      <Button size="sm" onClick={saveEdit}>저장</Button>
                      <Button size="sm" variant="outline" onClick={cancelEdit}>취소</Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(category)}
                        disabled={category.isDefault}
                      >
                        수정
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteCategory(category.id)}
                        disabled={category.isDefault}
                      >
                        삭제
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 새 카테고리 추가 */}
        <div className="border-t pt-4">
          <h4 className="font-medium mb-3">새 카테고리 추가</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                카테고리 이름
              </label>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="카테고리 이름을 입력하세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                maxLength={20}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                색상 선택
              </label>
              <div className="flex gap-2 flex-wrap">
                {availableColors.map(color => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${selectedColor === color
                      ? 'border-gray-800 scale-110'
                      : 'border-gray-300 hover:border-gray-500'
                      }`}
                    style={{ backgroundColor: color }}
                    title={`색상: ${color}`}
                  />
                ))}
              </div>
              {availableColors.length === 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  사용 가능한 색상이 없습니다. 기존 카테고리를 삭제해주세요.
                </p>
              )}
            </div>

            <Button
              onClick={handleAddCategory}
              disabled={!newCategoryName.trim() || !selectedColor || availableColors.length === 0}
              className="w-full"
            >
              카테고리 추가
            </Button>
          </div>
        </div>

        {/* 안내 메시지 */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">카테고리 관리 안내</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 기본 카테고리(회사, 가족, 개인)는 수정하거나 삭제할 수 없습니다.</li>
            <li>• 카테고리를 삭제하면 해당 카테고리의 할일들은 &quot;개인&quot; 카테고리로 이동됩니다.</li>
            <li>• 최대 {categories.length + availableColors.length}개의 카테고리를 만들 수 있습니다.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
