import React from 'react';
import { CalendarTodosProps } from './types/calendar';
import { getTodoCompletionStats, hasIncompleteTodos } from './utils/calendarUtils';

export const CalendarTodos: React.FC<CalendarTodosProps> = ({
  todos,
  date,
  compact = false,
}) => {
  if (todos.length === 0) return null;

  const { total, completed } = getTodoCompletionStats(todos);
  const hasIncomplete = hasIncompleteTodos(todos);

  if (compact) {
    const maxVisible = 4; // 더 많은 할일을 표시
    return (
      <div className="space-y-1 h-full flex flex-col">
        {todos.slice(0, maxVisible).map((todo) => (
          <div
            key={todo.id}
            className={`text-xs px-1.5 py-0.5 rounded-sm truncate flex-shrink-0 ${todo.completed
              ? 'bg-gray-100 text-gray-500 line-through'
              : 'bg-blue-100 text-blue-800'
              }`}
            title={todo.title}
          >
            {todo.title}
          </div>
        ))}
        {todos.length > maxVisible && (
          <div className="text-xs text-gray-500 px-1.5 py-0.5 flex-shrink-0">
            +{todos.length - maxVisible}개 더
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-1">
      {todos.map((todo) => (
        <div
          key={todo.id}
          className={`text-sm px-2 py-1 rounded-md ${todo.completed
            ? 'bg-gray-100 text-gray-500 line-through'
            : 'bg-blue-50 text-blue-900'
            }`}
        >
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full flex-shrink-0 ${todo.completed ? 'bg-gray-400' : 'bg-blue-500'
                }`}
            />
            <span className="truncate">{todo.title}</span>
          </div>
        </div>
      ))}

      {total > 1 && (
        <div className="text-xs text-gray-500 px-2 mt-1">
          {completed}/{total} 완료
        </div>
      )}
    </div>
  );
};
