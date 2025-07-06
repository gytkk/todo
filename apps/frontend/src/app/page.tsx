"use client";

import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import { Settings } from "@/components/settings";
import { StatisticsPage } from "@/components/statistics/StatisticsPage";
import { CalendarView } from "@/components/calendar/CalendarView";
import { TodoSidebar } from "@/components/todo/TodoSidebar";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useState, useCallback } from "react";
import { PageType } from "@calendar-todo/shared-types";
import { useAppContext } from "@/contexts/AppContext";

export default function Home() {
  const [currentPage, setCurrentPage] = useState<PageType>("home");
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(true);

  const {
    todos,
    clearAllTodos,
    selectedDate,
    isSidebarOpen,
    currentDate,
    handleDateSelect,
    closeSidebar,
    handleNavigate,
  } = useAppContext();

  const handleCalendarClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;

    if (
      target.classList.contains('rbc-day-bg') ||
      target.classList.contains('rbc-date-cell') ||
      target.classList.contains('rbc-month-view') ||
      target.classList.contains('rbc-month-row') ||
      target.classList.contains('rbc-row-bg') ||
      target.classList.contains('rbc-time-slot') ||
      target.classList.contains('rbc-time-column') ||
      target.classList.contains('rbc-time-content')
    ) {
      closeSidebar();
    }
  }, [closeSidebar]);

  const handlePageChange = useCallback((page: PageType) => {
    setCurrentPage(page);
    closeSidebar(); // 페이지 변경 시 TodoSidebar 닫기
  }, [closeSidebar]);

  const renderContent = () => {
    if (currentPage === "settings") {
      return (
        <div className="h-screen overflow-y-auto">
          <div className="p-6">
            <Settings todos={todos} onClearData={clearAllTodos} />
          </div>
        </div>
      );
    }

    if (currentPage === "statistics") {
      return (
        <div className="h-screen overflow-y-auto">
          <div className="p-6">
            <StatisticsPage todos={todos} />
          </div>
        </div>
      );
    }

    return (
      <ErrorBoundary>
        <Navbar onCloseTodoSidebar={closeSidebar} />
        <div className="h-[calc(100vh-4rem)] bg-white relative">
          <CalendarView
            currentDate={currentDate}
            selectedDate={selectedDate}
            todos={todos}
            onDateSelect={handleDateSelect}
            onNavigate={handleNavigate}
            onCalendarClick={handleCalendarClick}
          />
        </div>
        <TodoSidebar
          isOpen={isSidebarOpen}
          selectedDate={selectedDate}
          onClose={closeSidebar}
        />
      </ErrorBoundary>
    );
  };

  return (
    <ErrorBoundary>
      <div className="h-screen bg-white relative overflow-hidden">
        <Sidebar
          currentPage={currentPage}
          onPageChange={handlePageChange}
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
          {renderContent()}
        </div>
      </div>
    </ErrorBoundary>
  );
}
