export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const withErrorHandling = <T extends (...args: any[]) => any>(
  fn: T,
  fallback?: () => ReturnType<T>
): T => {
  return ((...args) => {
    try {
      return fn(...args);
    } catch (error) {
      console.error('Error in function:', error);
      if (fallback) return fallback();
      throw error;
    }
  }) as T;
};

export const handleAsyncError = async <T>(
  asyncFn: () => Promise<T>,
  fallback?: () => T
): Promise<T> => {
  try {
    return await asyncFn();
  } catch (error) {
    console.error('Async error:', error);
    if (fallback) return fallback();
    throw error;
  }
};

export const safeLocalStorageGet = (key: string, fallback: any = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error);
    return fallback;
  }
};

export const safeLocalStorageSet = (key: string, value: any): boolean => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error setting localStorage key "${key}":`, error);
    return false;
  }
};
