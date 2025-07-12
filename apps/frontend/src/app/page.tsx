"use client";

import { PageHeader } from "@/components/common/PageHeader";
import { CalendarView } from "@/components/calendar/CalendarView";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppLayout } from "@/components/AppLayout";
import { useCallback, Suspense, useEffect } from "react";
import { useTodoContext, useCategoryContext } from "@/contexts/AppContext";
import { useCalendar } from "@/hooks/useCalendar";
import { PageLoading } from "@/components/ui/loading";
import { ResponsiveContainer, ResponsiveTodoInterface } from "@/components/responsive";
import { useAuth } from "@/contexts/AuthContext";

function HomeContent() {
  const { todos } = useTodoContext();
  const { refreshCategories } = useCategoryContext();
  const { isAuthenticated } = useAuth();
  const {
    selectedDate,
    isSidebarOpen,
    currentDate,
    handleDateSelect,
    closeSidebar,
    handleNavigate,
  } = useCalendar(todos);

  // 카테고리 변경 이벤트 리스너
  useEffect(() => {
    const handleCategoryChange = async (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('HomePage: 카테고리 변경 감지, 새로고침 중...', customEvent.detail);
      await refreshCategories();
    };

    window.addEventListener('categoryChanged', handleCategoryChange);
    return () => {
      window.removeEventListener('categoryChanged', handleCategoryChange);
    };
  }, [refreshCategories]);

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
        <ResponsiveContainer 
          className="h-[calc(100vh-4rem)] bg-white relative" 
          sidebarOpen={isSidebarOpen}
        >
          <ResponsiveTodoInterface
            isOpen={isSidebarOpen}
            selectedDate={selectedDate}
            onClose={closeSidebar}
            calendarContent={
              <CalendarView
                currentDate={currentDate}
                selectedDate={selectedDate}
                todos={todos} // 인증 여부와 관계없이 todos 전달 (useTodos에서 처리)
                onDateSelect={handleDateSelect} // 인증 여부와 관계없이 날짜 선택 허용
                onNavigate={handleNavigate} // 달력 네비게이션은 허용
                onCalendarClick={isAuthenticated ? handleCalendarClick : () => {}} // 미인증 시 비활성화
              />
            }
          />
        </ResponsiveContainer>
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
