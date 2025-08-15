import { useState } from 'react';

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      if (typeof window === 'undefined') {
        return initialValue;
      }
      const item = window.localStorage.getItem(key);
      if (!item || item === 'undefined' || item === 'null') {
        return initialValue;
      }
      return JSON.parse(item);
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        // Special handling for arrays that might contain Date objects
        let serializedValue;
        if (Array.isArray(valueToStore)) {
          serializedValue = JSON.stringify(valueToStore, (key, val) => {
            if (val instanceof Date) {
              return val.toISOString();
            }
            return val;
          });
        } else {
          serializedValue = JSON.stringify(valueToStore);
        }
        window.localStorage.setItem(key, serializedValue);
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}