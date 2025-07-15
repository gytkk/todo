/**
 * Utility to clean up invalid data from localStorage
 */
export const cleanupInvalidTodos = () => {
  try {
    const savedTodos = localStorage.getItem('calendar-todos');
    if (!savedTodos) return;

    const todos = JSON.parse(savedTodos);
    if (!Array.isArray(todos)) {
      localStorage.setItem('calendar-todos', '[]');
      return;
    }

    const validTodos = todos.filter(todo => {
      // Check required fields
      if (!todo.id || !todo.title || !todo.date) {
        return false;
      }

      // Check date validity
      const date = new Date(todo.date);
      if (isNaN(date.getTime())) {
        return false;
      }

      return true;
    });

    if (validTodos.length !== todos.length) {
      localStorage.setItem('calendar-todos', JSON.stringify(validTodos));
    }
  } catch {
    // Reset to empty array on any error
    localStorage.setItem('calendar-todos', '[]');
  }
};

/**
 * Initialize data cleanup on app start
 */
export const initializeDataCleanup = () => {
  if (typeof window !== 'undefined') {
    cleanupInvalidTodos();
  }
};
