"use client";

import React, { useState, useMemo } from 'react';
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge
} from "@calendar-todo/ui";
import { Palette } from 'lucide-react';
import { useCategories } from '../../hooks/useCategories';
import { useCategoryContext } from '@/contexts/AppContext';
import { TodoCategory } from '@calendar-todo/shared-types';

export const CategoryManagement: React.FC = () => {
  const { categories, addCategory, updateCategory, deleteCategory } = useCategories();
  const { refreshCategories } = useCategoryContext();
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  // Get available colors directly without async state
  const availableColors = useMemo(() => {
    // This should be synchronous in real implementation
    // We're calling async function but handling it synchronously for now
    try {
      // In real app, this should be synchronous or use React Query
      const colors = ['#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#3b82f6'];
      const usedColors = categories.map(cat => cat.color);
      return colors.filter(color => !usedColors.includes(color));
    } catch (error) {
      console.error('Failed to get colors:', error);
      return [];
    }
  }, [categories]);

  const handleAddCategory = async () => {
    if (newCategoryName.trim() && selectedColor) {
      // 중복 이름 체크
      const nameExists = categories.some(cat =>
        cat.name.toLowerCase() === newCategoryName.trim().toLowerCase()
      );

      if (nameExists) {
        alert('이미 존재하는 카테고리 이름입니다.');
        return;
      }

      const result = await addCategory(newCategoryName.trim(), selectedColor);
      if (result) {
        setNewCategoryName('');
        setSelectedColor('');
        
        // Context를 통해 전체 앱의 카테고리 상태를 즉시 새로고침
        await refreshCategories();
        
        // 커스텀 이벤트로 다른 컴포넌트들에게 카테고리 변경 알림
        window.dispatchEvent(new CustomEvent('categoryChanged', { 
          detail: { type: 'added', category: result } 
        }));
        
        console.log('새 카테고리가 추가되어 캘린더에 반영됩니다:', result.name);
      }
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    // 최소 1개 카테고리는 유지해야 함
    if (categories.length <= 1) {
      alert('최소 1개의 카테고리는 유지해야 합니다.');
      return;
    }
    
    const result = await deleteCategory(categoryId, []);
    if (result) {
      // Context를 통해 전체 앱의 카테고리 상태를 즉시 새로고침
      await refreshCategories();
      
      // 커스텀 이벤트로 다른 컴포넌트들에게 카테고리 변경 알림
      window.dispatchEvent(new CustomEvent('categoryChanged', { 
        detail: { type: 'deleted', categoryId } 
      }));
      
      console.log('카테고리가 삭제되어 캘린더에서 제거됩니다:', categoryId);
    }
  };

  const startEdit = (category: TodoCategory) => {
    setEditingCategory(category.id);
    setEditName(category.name);
  };

  const saveEdit = async () => {
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

      const result = await updateCategory(editingCategory, { name: editName.trim() });
      if (result) {
        setEditingCategory(null);
        setEditName('');
        
        // Context를 통해 전체 앱의 카테고리 상태를 즉시 새로고침
        await refreshCategories();
        
        // 커스텀 이벤트로 다른 컴포넌트들에게 카테고리 변경 알림
        window.dispatchEvent(new CustomEvent('categoryChanged', { 
          detail: { type: 'updated', categoryId: editingCategory, name: editName.trim() } 
        }));
        
        console.log('카테고리가 수정되어 캘린더에 반영됩니다:', editingCategory);
      }
    }
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setEditName('');
  };

  return (
    <Card id="category-management">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          카테고리 관리
        </CardTitle>
        <CardDescription>
          할 일 카테고리를 관리하고 색상을 설정합니다
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>

        {/* 카테고리 목록 */}
        <div className="space-y-3 mb-6">
          {categories.map(category => {
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
                  {categories.length <= 1 && (
                    <Badge variant="secondary" className="text-xs">마지막</Badge>
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
                      >
                        수정
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteCategory(category.id)}
                        disabled={categories.length <= 1}
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
            <li>• 최소 1개의 카테고리는 항상 유지되어야 합니다.</li>
            <li>• 카테고리를 삭제하면 해당 카테고리의 할일들은 다른 카테고리로 이동됩니다.</li>
            <li>• 최대 {availableColors.length}개의 카테고리를 만들 수 있습니다.</li>
            <li>• 총 {availableColors.length}가지 색상을 사용할 수 있습니다.</li>
          </ul>
        </div>
        </div>
      </CardContent>
    </Card>
  );
};
