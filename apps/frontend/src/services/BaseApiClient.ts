interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  status: number;
}

export class BaseApiClient {
  protected handle401Error(): void {
    console.log('토큰 만료 또는 잘못된 토큰, 스토리지 정리');
    // localStorage와 sessionStorage 모두 정리
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('remember_me');
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('user_data');
    sessionStorage.removeItem('remember_me');
    
    // 쿠키도 정리
    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    
    // 새로고침 대신 로그인 페이지로 리다이렉트
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  protected getAuthHeaders(): Record<string, string> {
    // localStorage와 sessionStorage 모두 확인 (AuthContext와 일치)
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  protected async makeRequest<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getAuthHeaders(),
          ...options.headers,
        },
      });

      if (response.status === 401) {
        this.handle401Error();
        return { status: 401, error: 'Unauthorized' };
      }

      const data = await response.json();

      if (!response.ok) {
        return {
          status: response.status,
          error: data.message || `HTTP error! status: ${response.status}`,
        };
      }

      return { status: response.status, data };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        status: 500,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  protected async get<T>(url: string): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, { method: 'GET' });
  }

  protected async post<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  protected async put<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  protected async delete<T>(url: string): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, { method: 'DELETE' });
  }
}