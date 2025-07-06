"use client";

import { Sidebar } from "@/components/sidebar";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useState } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { usePathname } from "next/navigation";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const { closeSidebar } = useAppContext();
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
          {children}
        </div>
      </div>
    </ErrorBoundary>
  );
}