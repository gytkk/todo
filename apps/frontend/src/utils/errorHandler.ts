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

export const withErrorHandling = <T extends (...args: unknown[]) => unknown>(
  fn: T,
  fallback?: () => ReturnType<T>
): T => {
  return ((...args) => {
    try {
      return fn(...args);
    } catch (error) {
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
    if (fallback) return fallback();
    throw error;
  }
};

export const safeLocalStorageGet = (key: string, fallback: unknown = null) => {
  try {
    const item = localStorage.getItem(key);
    if (!item || item === 'undefined' || item === 'null') {
      return fallback;
    }
    return JSON.parse(item);
  } catch {
    return fallback;
  }
};

export const safeLocalStorageSet = (key: string, value: unknown): boolean => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
};
