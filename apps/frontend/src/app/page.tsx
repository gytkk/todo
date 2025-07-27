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
import { TaskMoveStatus } from "@/components/todo/TaskMoveStatus";
import { useTaskMover } from "@/hooks/useTaskMover";

function HomeContent() {
  const { todos } = useTodoContext();
  const { getFilteredTodos, refreshCategories, categoryFilter, categories } = useCategoryContext();
  const { isAuthenticated } = useAuth();
  const { recentlyMovedTaskIds } = useTaskMover();
  const {
    selectedDate,
    isSidebarOpen,
    currentDate,
    handleDateSelect,
    handleDateChangeWithoutSidebar,
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

  // 필터가 활성화되어 있는지 확인
  const hasActiveFilters = categories.some(category => 
    categoryFilter[category.id] === false
  );

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
                todos={getFilteredTodos(todos)} // 카테고리 필터가 적용된 todos 전달
                onDateSelect={handleDateSelect} // 인증 여부와 관계없이 날짜 선택 허용
                onDateChangeWithoutSidebar={handleDateChangeWithoutSidebar} // DailyView용 핸들러
                onNavigate={handleNavigate} // 달력 네비게이션은 허용
                onCalendarClick={isAuthenticated ? handleCalendarClick : () => {}} // 미인증 시 비활성화
                allTodos={todos} // 필터링 전 전체 할일 목록
                hasActiveFilters={hasActiveFilters} // 필터 활성화 여부
                recentlyMovedTaskIds={recentlyMovedTaskIds} // 최근 이동된 작업 ID 목록
              />
            }
          />
        </ResponsiveContainer>
        
        {/* 작업 이동 상태 표시 */}
        {isAuthenticated && <TaskMoveStatus />}
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
