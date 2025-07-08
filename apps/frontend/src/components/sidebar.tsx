"use client";

import { useState, useEffect } from "react";
import { Button } from "@calendar-todo/ui";
import { Home, Settings, Menu, User, LucideIcon, BarChart3, LogIn, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { CategoryFilter } from "@/components/categories/CategoryFilter";
import { useAppContext } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { PageType } from "@calendar-todo/shared-types";

interface MenuItem {
  id: PageType;
  name: string;
  icon: LucideIcon;
  href: string;
}

interface SidebarProps {
  currentPage: PageType;
  onSidebarStateChange?: (expanded: boolean, visible: boolean) => void;
  onCloseTodoSidebar?: () => void;
}

export function Sidebar({ onSidebarStateChange, onCloseTodoSidebar }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const { categories, categoryFilter, toggleCategoryFilter } = useAppContext();
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();

  const menuItems: MenuItem[] = [
    {
      id: "home",
      name: "홈",
      icon: Home,
      href: "/",
    },
    {
      id: "statistics",
      name: "통계",
      icon: BarChart3,
      href: "/statistics",
    },
    {
      id: "settings",
      name: "설정",
      icon: Settings,
      href: "/settings",
    }
  ];

  const toggleExpanded = (): void => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    onSidebarStateChange?.(newExpanded, isVisible);
    if (onCloseTodoSidebar) {
      onCloseTodoSidebar();
    }
  };

  const toggleVisible = (): void => {
    const newVisible = !isVisible;
    setIsVisible(newVisible);
    onSidebarStateChange?.(isExpanded, newVisible);
    if (onCloseTodoSidebar) {
      onCloseTodoSidebar();
    }
  };

  // 초기 상태 전달
  useEffect(() => {
    onSidebarStateChange?.(isExpanded, isVisible);
  }, [isExpanded, isVisible, onSidebarStateChange]);

  return (
    <>
      {/* 토글 버튼 - 사이드바가 숨겨진 경우 */}
      {!isVisible && (
        <Button
          variant="outline"
          size="sm"
          className="fixed top-4 left-4 z-50 bg-white border-gray-200 shadow-md"
          onClick={toggleVisible}
        >
          <Menu className="h-4 w-4" />
        </Button>
      )}

      {/* 사이드바 */}
      <div 
        className={cn(
          "fixed left-0 top-0 h-screen bg-white border-r border-gray-100 shadow-sm transition-all duration-300 ease-in-out z-40 flex flex-col",
          isVisible ? "translate-x-0" : "-translate-x-full",
          isExpanded ? "w-64" : "w-16"
        )}
        onClick={(e) => {
          // 사이드바 배경 클릭 시에만 TodoSidebar 닫기
          if (e.target === e.currentTarget && onCloseTodoSidebar) {
            onCloseTodoSidebar();
          }
        }}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100">
          {isExpanded && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-gray-500" />
              </div>
              <div className="text-sm">
                {isAuthenticated ? (
                  <div>
                    <div className="font-medium text-gray-900">
                      {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.username || user?.email}
                    </div>
                    <div className="text-xs text-gray-500">{user?.email}</div>
                  </div>
                ) : (
                  <div className="text-gray-500 italic">로그인이 필요합니다</div>
                )}
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleExpanded}
            className="h-8 w-8 p-0 hover:bg-gray-100"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>

        {/* 메뉴 아이템들 */}
        <div className="p-2 space-y-2">
          {menuItems.map((item: MenuItem) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link key={item.id} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start h-12 px-3 py-2 text-left hover:bg-gray-50",
                    isActive && "bg-gray-100 text-gray-900",
                    !isExpanded && "justify-center px-0"
                  )}
                  onClick={(): void => {
                    if (onCloseTodoSidebar) {
                      onCloseTodoSidebar();
                    }
                  }}
                >
                  <Icon className={cn("h-5 w-5", isExpanded && "mr-3")} />
                  {isExpanded && (
                    <div className="flex flex-col items-start">
                      <span className="font-medium text-sm">{item.name}</span>
                    </div>
                  )}
                </Button>
              </Link>
            );
          })}
        </div>

        {/* 카테고리 필터 - 홈 페이지에서만 표시 */}
        {isExpanded && pathname === "/" && (
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <CategoryFilter
              categories={categories}
              categoryFilter={categoryFilter}
              onToggleCategory={toggleCategoryFilter}
            />
          </div>
        )}

        {/* 인증 컨트롤 */}
        <div className="p-2 border-t border-gray-100 mt-auto">
          {isAuthenticated ? (
            <Button
              variant="ghost"
              onClick={logout}
              className={cn(
                "w-full justify-start h-12 px-3 py-2 text-left hover:bg-gray-50 text-red-600 hover:text-red-700",
                !isExpanded && "justify-center px-0"
              )}
            >
              <LogOut className={cn("h-5 w-5", isExpanded && "mr-3")} />
              {isExpanded && "로그아웃"}
            </Button>
          ) : (
            <Link href="/login">
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start h-12 px-3 py-2 text-left hover:bg-gray-50",
                  !isExpanded && "justify-center px-0"
                )}
              >
                <LogIn className={cn("h-5 w-5", isExpanded && "mr-3")} />
                {isExpanded && "로그인"}
              </Button>
            </Link>
          )}
        </div>

      </div>
    </>
  );
}
