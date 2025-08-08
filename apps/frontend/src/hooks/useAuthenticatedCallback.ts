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
export function useAuthenticatedCallback<TArgs extends unknown[], TReturn>(
  callback: (...args: TArgs) => TReturn,
  fallback: TReturn,
  deps: React.DependencyList = []
): (...args: TArgs) => TReturn {
  const { isAuthenticated } = useAuth();

  return useCallback(
    (...args: TArgs): TReturn => {
      if (!isAuthenticated) {
        return fallback;
      }
      return callback(...args);
    },
    [isAuthenticated, ...deps] // callback과 fallback은 parent에서 메모이제이션 해야 함
  );
}
