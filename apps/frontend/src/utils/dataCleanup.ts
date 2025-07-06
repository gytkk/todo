/**
 * Utility to clean up invalid data from localStorage
 */
export const cleanupInvalidTodos = () => {
  try {
    const savedTodos = localStorage.getItem('calendar-todos');
    if (!savedTodos) return;

    const todos = JSON.parse(savedTodos);
    if (!Array.isArray(todos)) {
      console.warn('Invalid todos format, resetting...');
      localStorage.setItem('calendar-todos', '[]');
      return;
    }

    const validTodos = todos.filter(todo => {
      // Check required fields
      if (!todo.id || !todo.title || !todo.date) {
        console.warn('Todo missing required fields:', todo);
        return false;
      }

      // Check date validity
      const date = new Date(todo.date);
      if (isNaN(date.getTime())) {
        console.warn('Todo has invalid date:', todo);
        return false;
      }

      return true;
    });

    if (validTodos.length !== todos.length) {
      console.log(`Cleaned up ${todos.length - validTodos.length} invalid todos`);
      localStorage.setItem('calendar-todos', JSON.stringify(validTodos));
    }
  } catch (error) {
    console.error('Error cleaning up todos:', error);
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
