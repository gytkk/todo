"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, Settings, Menu, User, LucideIcon, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

import { PageType } from "@/types";

interface MenuItem {
  id: PageType;
  name: string;
  icon: LucideIcon;
}

interface SidebarProps {
  currentPage: PageType;
  onPageChange: (page: PageType) => void;
  onSidebarStateChange?: (expanded: boolean, visible: boolean) => void;
  onCloseTodoSidebar?: () => void;
}

export function Sidebar({ currentPage, onPageChange, onSidebarStateChange, onCloseTodoSidebar }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isVisible, setIsVisible] = useState(true);

  const menuItems: MenuItem[] = [
    {
      id: "home",
      name: "홈",
      icon: Home,
    },
    {
      id: "statistics",
      name: "통계",
      icon: BarChart3,
    },
    {
      id: "settings",
      name: "설정",
      icon: Settings,
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
          "fixed left-0 top-0 h-screen bg-white border-r border-gray-100 shadow-sm transition-all duration-300 ease-in-out z-40",
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
              <div className="text-sm text-gray-500 italic">
                사용자 이름
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
            const isActive = currentPage === item.id;

            return (
              <Button
                key={item.id}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start h-12 px-3 py-2 text-left hover:bg-gray-50",
                  isActive && "bg-gray-100 text-gray-900",
                  !isExpanded && "justify-center px-0"
                )}
                onClick={(): void => {
                  onPageChange(item.id);
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
            );
          })}
        </div>

        {/* 하단 정보 */}
        {isExpanded && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-gray-50">
            <div className="text-xs text-gray-500 text-center">
              Next.js 15 + shadcn/ui
            </div>
          </div>
        )}
      </div>
    </>
  );
}
