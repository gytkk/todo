"use client";

import { useState, useCallback, memo } from "react";
import { Button } from "@calendar-todo/ui";
import { CategorySelector } from "@/components/categories/CategorySelector";
import { TodoCategory } from "@calendar-todo/shared-types";

interface TodoFormProps {
  onAddTodo: (title: string, categoryId: string) => void;
  categories: TodoCategory[];
  disabled?: boolean;
}

function TodoFormComponent({ onAddTodo, categories, disabled = false }: TodoFormProps) {
  const [title, setTitle] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0]?.id || "personal");

  const handleSubmit = useCallback(() => {
    if (title.trim() && selectedCategoryId) {
      onAddTodo(title, selectedCategoryId);
      setTitle("");
    }
  }, [title, selectedCategoryId, onAddTodo]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  }, [handleSubmit]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="새 할일을 입력하세요"
          className="flex-1 px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white"
          onKeyPress={handleKeyPress}
          disabled={disabled}
        />
        <Button onClick={handleSubmit} disabled={disabled || !title.trim()}>
          추가
        </Button>
      </div>

      <CategorySelector
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={setSelectedCategoryId}
        disabled={disabled}
      />
    </div>
  );
}

export const TodoForm = memo(TodoFormComponent);
