"use client";

import { Sidebar } from "@/components/sidebar";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useState } from "react";
import { useCalendarContext } from "@/contexts/AppContext";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const { closeSidebar } = useCalendarContext();
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();

  // pathname을 기반으로 currentPage 결정
  const getCurrentPage = () => {
    switch (pathname) {
      case '/':
        return 'home';
      case '/statistics':
        return 'statistics';
      case '/settings':
        return 'settings';
      default:
        return 'home';
    }
  };

  // 보호된 페이지 확인 (메인 페이지는 제외)
  const isProtectedPage = ['/settings', '/statistics'].includes(pathname);

  // 로딩 중일 때는 항상 로딩 화면 표시 (인증 상태와 무관하게)
  if (isLoading) {
    return (
      <ErrorBoundary>
        <div className="h-screen bg-white relative overflow-hidden">
          <Sidebar
            currentPage={getCurrentPage()}
            onSidebarStateChange={(expanded, visible) => {
              setSidebarExpanded(expanded);
              setSidebarVisible(visible);
            }}
            onCloseTodoSidebar={closeSidebar}
          />
          <div className={`h-screen transition-all duration-300 ease-in-out ${sidebarVisible
            ? (sidebarExpanded ? 'ml-64' : 'ml-16')
            : 'ml-0'
            }`}>
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-muted-foreground">로딩 중...</p>
              </div>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  // 보호된 페이지이지만 인증되지 않은 경우 로그인 안내
  if (isProtectedPage && !isAuthenticated) {
    return (
      <ErrorBoundary>
        <div className="h-screen bg-white relative overflow-hidden">
          <Sidebar
            currentPage={getCurrentPage()}
            onSidebarStateChange={(expanded, visible) => {
              setSidebarExpanded(expanded);
              setSidebarVisible(visible);
            }}
            onCloseTodoSidebar={closeSidebar}
          />
          <div className={`h-screen transition-all duration-300 ease-in-out ${sidebarVisible
            ? (sidebarExpanded ? 'ml-64' : 'ml-16')
            : 'ml-0'
            }`}>
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-8">
                <div className="mb-6">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">로그인이 필요합니다</h3>
                <p className="text-gray-500 mb-6">이 페이지에 접근하려면 로그인해야 합니다.</p>
                <a 
                  href="/login" 
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  로그인하기
                </a>
              </div>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="h-screen bg-white relative">
        <Sidebar
          currentPage={getCurrentPage()}
          onSidebarStateChange={(expanded, visible) => {
            setSidebarExpanded(expanded);
            setSidebarVisible(visible);
          }}
          onCloseTodoSidebar={closeSidebar}
        />
        <div className={`h-screen transition-all duration-300 ease-in-out ${sidebarVisible
          ? (sidebarExpanded ? 'ml-64' : 'ml-16')
          : 'ml-0'
          }`}>
          {children}
        </div>
      </div>
    </ErrorBoundary>
  );
}