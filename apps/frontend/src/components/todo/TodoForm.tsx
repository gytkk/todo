"use client";

import { useState, useCallback, memo } from "react";
import { Button, Switch, Label } from "@calendar-todo/ui";
import { CategorySelector } from "@/components/categories/CategorySelector";
import { TodoCategory, TodoType } from "@calendar-todo/shared-types";

interface TodoFormProps {
  onAddTodo: (title: string, categoryId: string, todoType: TodoType) => void;
  categories: TodoCategory[];
  disabled?: boolean;
}

function TodoFormComponent({ onAddTodo, categories, disabled = false }: TodoFormProps) {
  const [title, setTitle] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0]?.id || "personal");
  const [selectedTodoType, setSelectedTodoType] = useState<TodoType>("event");

  const handleSubmit = useCallback(() => {
    if (title.trim() && selectedCategoryId) {
      onAddTodo(title, selectedCategoryId, selectedTodoType);
      setTitle("");
    }
  }, [title, selectedCategoryId, selectedTodoType, onAddTodo]);

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

      <div className="flex gap-4">
        <CategorySelector
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
          disabled={disabled}
        />
        
        <div className="flex items-center gap-3">
          <Label htmlFor="todo-type-switch" className="text-sm font-medium">
            이벤트
          </Label>
          <Switch
            id="todo-type-switch"
            checked={selectedTodoType === "task"}
            onCheckedChange={(checked) => setSelectedTodoType(checked ? "task" : "event")}
            disabled={disabled}
          />
          <Label htmlFor="todo-type-switch" className="text-sm font-medium">
            작업
          </Label>
        </div>
      </div>
    </div>
  );
}

export const TodoForm = memo(TodoFormComponent);
