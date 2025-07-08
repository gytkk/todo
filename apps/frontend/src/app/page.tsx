"use client";

import { PageHeader } from "@/components/common/PageHeader";
import { CalendarView } from "@/components/calendar/CalendarView";
import { TodoSidebar } from "@/components/todo/TodoSidebar";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppLayout } from "@/components/AppLayout";
import { useCallback, Suspense } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { useCalendarWithUrl } from "@/hooks/useCalendarWithUrl";
import { PageLoading } from "@/components/ui/loading";

function HomeContent() {
  const { todos } = useAppContext();
  const {
    selectedDate,
    isSidebarOpen,
    currentDate,
    handleDateSelect,
    closeSidebar,
    handleNavigate,
  } = useCalendarWithUrl(todos);

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

  return (
    <AppLayout>
      <ErrorBoundary>
        <PageHeader title="홈" onCloseTodoSidebar={closeSidebar} />
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
    </AppLayout>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<PageLoading />}>
      <HomeContent />
    </Suspense>
  );
}
