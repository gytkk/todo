import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * 인증이 필요한 콜백 함수를 위한 커스텀 훅
 * 인증되지 않은 상태에서는 fallback 값을 반환하고, 
 * 인증된 상태에서만 실제 콜백을 실행합니다.
 * 
 * @param callback 실행할 콜백 함수
 * @param fallback 인증되지 않은 상태에서 반환할 값
 * @param deps 의존성 배열 (isAuthenticated는 자동으로 포함됨)
 * @returns 인증 체크가 포함된 메모이제이션된 콜백 함수
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useAuthenticatedCallback<T extends (...args: any[]) => any>(
  callback: T,
  fallback: ReturnType<T>,
  deps: React.DependencyList = []
): T {
  const { isAuthenticated } = useAuth();

  return useCallback(
    ((...args: Parameters<T>) => {
      if (!isAuthenticated) {
        return fallback;
      }
      return callback(...args);
    }) as T,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isAuthenticated, ...deps] // isAuthenticated가 자동으로 의존성에 포함됨
  );
}