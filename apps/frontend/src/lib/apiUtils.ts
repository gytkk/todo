/**
 * API 유틸리티 함수들
 */

/**
 * 인증 헤더를 포함한 기본 헤더를 생성합니다
 */
export function createAuthHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...additionalHeaders,
  };

  // JWT 토큰이 있다면 Authorization 헤더에 추가
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
}

/**
 * 인증된 fetch 요청을 수행합니다
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const { headers = {}, ...otherOptions } = options;
  
  return fetch(url, {
    ...otherOptions,
    headers: createAuthHeaders(headers as Record<string, string>),
    credentials: 'include',
  });
}