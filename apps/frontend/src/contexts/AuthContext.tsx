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

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
      const response = await fetch('/api/auth/validate', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('토큰 검증 오류:', error);
      return false;
    }
  };

  // 컴포넌트 마운트 시 저장소에서 사용자 정보 복원
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // localStorage와 sessionStorage 모두 확인
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
        const userData = localStorage.getItem('user_data') || sessionStorage.getItem('user_data');
        
        if (token && userData) {
          // 토큰 유효성 검증
          const isValidToken = await validateToken(token);
          
          if (isValidToken) {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            // 쿠키에도 토큰 설정
            document.cookie = `auth-token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; samesite=strict`;
          } else {
            // 토큰이 유효하지 않으면 갱신 시도
            const refreshSuccess = await refreshAuthToken();
            
            if (refreshSuccess) {
              const parsedUser = JSON.parse(userData);
              setUser(parsedUser);
            } else {
              // 갱신 실패 시 로그아웃 - 모든 저장소 정리
              localStorage.removeItem('auth_token');
              localStorage.removeItem('refresh_token');
              localStorage.removeItem('user_data');
              localStorage.removeItem('remember_me');
              sessionStorage.removeItem('auth_token');
              sessionStorage.removeItem('refresh_token');
              sessionStorage.removeItem('user_data');
              sessionStorage.removeItem('remember_me');
              document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            }
          }
        }
      } catch (error) {
        console.error('인증 초기화 오류:', error);
        // 손상된 데이터 정리 - 모든 저장소
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_data');
        localStorage.removeItem('remember_me');
        sessionStorage.removeItem('auth_token');
        sessionStorage.removeItem('refresh_token');
        sessionStorage.removeItem('user_data');
        sessionStorage.removeItem('remember_me');
        document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      } finally {
        setIsLoading(false);
        setHydrated(true);
      }
    };

    initializeAuth();

    // 15분마다 토큰 갱신 시도
    const tokenRefreshInterval = setInterval(async () => {
      if (user) {
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
        if (token) {
          const isValid = await validateToken(token);
          if (!isValid) {
            await refreshAuthToken();
          }
        }
      }
    }, 15 * 60 * 1000); // 15분

    return () => {
      clearInterval(tokenRefreshInterval);
    };
  }, [user]);

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
      storage.setItem('auth_token', authResponse.accessToken);
      storage.setItem('refresh_token', authResponse.refreshToken);
      storage.setItem('user_data', JSON.stringify({
        ...authResponse.user,
        isActive: true,
        updatedAt: new Date(),
      }));

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
    localStorage.removeItem('remember_me');
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('user_data');
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

  // 하이드레이션이 완료되지 않았을 때 로딩 표시
  if (!hydrated) {
    return (
      <AuthContext.Provider value={value}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-muted-foreground">로딩 중...</p>
          </div>
        </div>
      </AuthContext.Provider>
    );
  }

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

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-muted-foreground">로딩 중...</p>
          </div>
        </div>
      );
    }

    if (!isAuthenticated) {
      // 클라이언트 사이드에서만 리다이렉트
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return null;
    }

    return <Component {...props} />;
  };
}