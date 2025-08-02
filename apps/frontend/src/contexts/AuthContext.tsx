"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginRequest, AuthResponse } from '@calendar-todo/shared-types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// 서버와 클라이언트 모두에서 동일한 초기 상태 사용
const getInitialAuthState = () => {
  // localStorage 확인 전까지는 로딩 상태로 시작 (깜빡임 방지)
  return { user: null, isLoading: true };
};

export function AuthProvider({ children }: AuthProviderProps) {
  const initialState = getInitialAuthState();
  const [user, setUser] = useState<User | null>(initialState.user);
  const [isLoading, setIsLoading] = useState(initialState.isLoading);
  const [hydrated, setHydrated] = useState(false);

  const isAuthenticated = !!user;

  // 토큰 검증 및 자동 갱신
  const refreshAuthToken = async (): Promise<boolean> => {
    try {
      // localStorage와 sessionStorage 모두 확인
      const refreshToken = localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');
      if (!refreshToken) {
        return false;
      }

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        return false;
      }

      const authResponse: AuthResponse = await response.json();

      // 기존 저장소 유형 확인
      const rememberMe = localStorage.getItem('remember_me') === 'true' || sessionStorage.getItem('remember_me') === 'true';
      const storage = rememberMe ? localStorage : sessionStorage;
      
      // 새 토큰으로 업데이트
      storage.setItem('auth_token', authResponse.accessToken);
      storage.setItem('refresh_token', authResponse.refreshToken);
      
      // 사용자 설정도 업데이트 (refresh 시에도 최신 설정 받기)
      if (authResponse.userSettings) {
        storage.setItem('user_settings', JSON.stringify(authResponse.userSettings));
      }
      
      const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 0;
      const cookieOptions = maxAge > 0 ? `max-age=${maxAge}` : '';
      document.cookie = `auth-token=${authResponse.accessToken}; path=/; ${cookieOptions}; samesite=strict`;

      return true;
    } catch (error) {
      console.error('토큰 갱신 오류:', error);
      return false;
    }
  };

  // 토큰 검증
  const validateToken = async (token: string): Promise<boolean> => {
    try {
      console.log('토큰 검증 시작:', token.substring(0, 20) + '...');
      
      const response = await fetch('/api/auth/validate', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('토큰 검증 응답:', response.status, response.statusText);
      return response.ok;
    } catch (error) {
      console.error('토큰 검증 오류:', error);
      return false;
    }
  };

  // 컴포넌트 마운트 시 localStorage에서 사용자 정보 로드
  useEffect(() => {
    // 클라이언트에서만 실행
    if (typeof window !== 'undefined') {
      try {
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
        const userData = localStorage.getItem('user_data') || sessionStorage.getItem('user_data');
        
        if (token && userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          
          // 쿠키 설정
          document.cookie = `auth-token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; samesite=strict`;
        }
      } catch (error) {
        console.error('사용자 정보 로드 오류:', error);
      }
      
      // localStorage 확인 완료 후 로딩 상태 종료
      setIsLoading(false);
    }

    // 하이드레이션 완료
    setHydrated(true);

    // 토큰 갱신 interval은 한 번만 설정하고 user 상태 변경에 의존하지 않음
    const tokenRefreshInterval = setInterval(async () => {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      if (token) {
        const isValid = await validateToken(token);
        if (!isValid) {
          const refreshSuccess = await refreshAuthToken();
          if (!refreshSuccess) {
            // 갱신 실패 시에만 로그아웃
            logout();
          }
        }
      }
    }, 30 * 60 * 1000); // 30분으로 간격 늘림

    return () => {
      clearInterval(tokenRefreshInterval);
    };
  }, []); // 의존성 배열을 비워서 한 번만 실행

  const login = async (credentials: LoginRequest): Promise<void> => {
    setIsLoading(true);
    
    try {
      // 실제 API 호출
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '로그인 중 오류가 발생했습니다');
      }

      const authResponse: AuthResponse = await response.json();

      // rememberMe에 따라 저장소 선택
      const storage = credentials.rememberMe ? localStorage : sessionStorage;
      
      // 토큰과 사용자 정보 저장
      console.log('로그인 성공 - 토큰 저장:', authResponse.accessToken.substring(0, 20) + '...');
      console.log('로그인 성공 - 저장소 유형:', credentials.rememberMe ? 'localStorage' : 'sessionStorage');
      
      storage.setItem('auth_token', authResponse.accessToken);
      storage.setItem('refresh_token', authResponse.refreshToken);
      storage.setItem('user_data', JSON.stringify({
        ...authResponse.user,
        isActive: true,
        updatedAt: new Date(),
      }));
      
      // 사용자 설정 저장
      storage.setItem('user_settings', JSON.stringify(authResponse.userSettings));

      // rememberMe 설정도 저장
      storage.setItem('remember_me', String(credentials.rememberMe || false));

      // 쿠키에도 토큰 설정 (미들웨어에서 사용)
      // rememberMe가 true면 30일, false면 세션만 유지
      const maxAge = credentials.rememberMe ? 30 * 24 * 60 * 60 : 0; // 30일 또는 세션
      const cookieOptions = maxAge > 0 ? `max-age=${maxAge}` : '';
      document.cookie = `auth-token=${authResponse.accessToken}; path=/; ${cookieOptions}; samesite=strict`;

      setUser({
        ...authResponse.user,
        isActive: true,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('로그인 오류:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // 모든 저장소 정리
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('user_settings');
    localStorage.removeItem('remember_me');
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('user_data');
    sessionStorage.removeItem('user_settings');
    sessionStorage.removeItem('remember_me');
    
    // 쿠키 정리
    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    
    // 상태 초기화
    setUser(null);
    
    // 로그인 페이지로 리다이렉트
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    // 기존 저장소 유형 확인하여 같은 저장소에 업데이트
    const rememberMe = localStorage.getItem('remember_me') === 'true' || sessionStorage.getItem('remember_me') === 'true';
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('user_data', JSON.stringify(updatedUser));
  };

  const value: AuthContextType = {
    user,
    isLoading: isLoading || !hydrated, // 하이드레이션이 완료되지 않았거나 로딩 중일 때 true
    isAuthenticated,
    login,
    logout,
    updateUser,
  };

  // 항상 동일한 구조를 렌더링하여 hydration mismatch 방지
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth는 AuthProvider 내에서 사용되어야 합니다');
  }
  return context;
}

// 인증이 필요한 컴포넌트를 감싸는 HOC
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth();

    // 성능 최적화를 위해 디버깅 로그 제거
    // const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')) : null;
    // console.log('withAuth - 토큰 존재:', !!token);
    // console.log('withAuth - 인증 상태:', isAuthenticated);
    // console.log('withAuth - 로딩 상태:', isLoading);

    if (isLoading) {
      // 로딩 시간을 최소화하기 위해 간단한 로딩 표시 또는 즉시 렌더링
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      // 클라이언트 사이드에서만 리다이렉트
      if (typeof window !== 'undefined') {
        // console.log('withAuth - 인증 실패, 로그인 페이지로 이동');
        // 더 부드러운 리다이렉트를 위해 setTimeout 사용
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      }
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-muted-foreground">로그인 페이지로 이동합니다...</p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}