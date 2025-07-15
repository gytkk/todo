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
import { Palette, GripVertical } from 'lucide-react';
import { useCategories } from '../../hooks/useCategories';
import { useCategoryContext } from '@/contexts/AppContext';
import { TodoCategory } from '@calendar-todo/shared-types';
import { CATEGORY_COLORS } from '@/constants/categories';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable Category Item Component
interface SortableCategoryItemProps {
  category: TodoCategory;
  editingCategory: string | null;
  editName: string;
  setEditName: (name: string) => void;
  onStartEdit: (category: TodoCategory) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: (categoryId: string) => void;
  isLastCategory: boolean;
}

const SortableCategoryItem: React.FC<SortableCategoryItemProps> = ({
  category,
  editingCategory,
  editName,
  setEditName,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  isLastCategory,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-3 bg-gray-50 rounded-lg ${
        isDragging ? 'z-50' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 rounded"
        >
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>
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
        {isLastCategory && (
          <Badge variant="secondary" className="text-xs">마지막</Badge>
        )}
      </div>

      <div className="flex items-center gap-2">
        {editingCategory === category.id ? (
          <>
            <Button size="sm" onClick={onSaveEdit}>저장</Button>
            <Button size="sm" variant="outline" onClick={onCancelEdit}>취소</Button>
          </>
        ) : (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onStartEdit(category)}
            >
              수정
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onDelete(category.id)}
              disabled={isLastCategory}
            >
              삭제
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export const CategoryManagement: React.FC = () => {
  const { categories, addCategory, updateCategory, deleteCategory, reorderCategories } = useCategories();
  const { refreshCategories } = useCategoryContext();
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  
  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  // Get all available colors (pre-sorted by hue)
  const availableColors = useMemo(() => {
    try {
      // Use pre-sorted colors from constants for better performance
      return CATEGORY_COLORS;
    } catch (error) {
      console.error('Failed to get colors:', error);
      return [];
    }
  }, []);

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
        
      }
    }
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setEditName('');
  };

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = categories.findIndex(cat => cat.id === active.id);
      const newIndex = categories.findIndex(cat => cat.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        // 새로운 순서로 배열 정렬
        const newOrder = arrayMove(categories, oldIndex, newIndex);
        const categoryIds = newOrder.map(cat => cat.id);
        
        try {
          await reorderCategories(categoryIds);
          await refreshCategories();
          
          // 커스텀 이벤트로 다른 컴포넌트들에게 카테고리 변경 알림
          window.dispatchEvent(new CustomEvent('categoryChanged', { 
            detail: { type: 'reordered', categoryIds } 
          }));
          
        } catch (error) {
          console.error('카테고리 순서 변경 실패:', error);
        }
      }
    }
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
        <div className="mb-6">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={categories.map(cat => cat.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {categories.map(category => (
                  <SortableCategoryItem
                    key={category.id}
                    category={category}
                    editingCategory={editingCategory}
                    editName={editName}
                    setEditName={setEditName}
                    onStartEdit={startEdit}
                    onSaveEdit={saveEdit}
                    onCancelEdit={cancelEdit}
                    onDelete={handleDeleteCategory}
                    isLastCategory={categories.length <= 1}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
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
                  색상을 불러올 수 없습니다.
                </p>
              )}
            </div>

            <Button
              onClick={handleAddCategory}
              disabled={!newCategoryName.trim() || !selectedColor}
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
            <li>• 여러 카테고리가 같은 색상을 사용할 수 있습니다.</li>
            <li>• 총 {availableColors.length}가지 색상을 사용할 수 있습니다.</li>
          </ul>
        </div>
        </div>
      </CardContent>
    </Card>
  );
};
