"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { DaySection } from './DaySection';
import { useDailyView } from './hooks/useDailyView';
import { useTodoContext, useCategoryContext } from '@/contexts/AppContext';

interface DailyViewProps {
  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
}

export const DailyView: React.FC<DailyViewProps> = ({
  selectedDate: initialDate,
  onDateChange,
}) => {
  const {
    todos,
    addTodo,
    toggleTodo,
    deleteTodo
  } = useTodoContext();
  const {
    categories,
    refreshCategories
  } = useCategoryContext();

  // 스크롤 기반 날짜 선택을 위한 상태
  const [, setVisibleDate] = useState<Date>(initialDate || new Date());
  
  // 디바운스를 위한 ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 이미 필터링된 todos를 받으므로 추가 필터링 불필요
  const {
    dailyData,
    selectedDate,
    goToToday,
    goToDate,
    isToday
  } = useDailyView(initialDate, todos);

  // 날짜 변경 시 부모 컴포넌트에 알림
  useEffect(() => {
    if (onDateChange) {
      onDateChange(selectedDate);
    }
  }, [selectedDate, onDateChange]);

  // 카테고리 변경 이벤트 리스너
  useEffect(() => {
    const handleCategoryChange = async (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('DailyView: 카테고리 변경 감지, 새로고침 중...', customEvent.detail);
      await refreshCategories();
    };

    window.addEventListener('categoryChanged', handleCategoryChange);
    return () => {
      window.removeEventListener('categoryChanged', handleCategoryChange);
    };
  }, [refreshCategories]);

  // 키보드 단축키 처리 (스크롤 기반으로 변경)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 입력 필드에 포커스가 있을 때는 단축키 비활성화
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const container = scrollContainerRef.current;
      if (!container) return;

      switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          container.scrollBy({ top: -200, behavior: 'smooth' });
          break;
        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault();
          container.scrollBy({ top: 200, behavior: 'smooth' });
          break;
        case 't':
        case 'T':
          event.preventDefault();
          goToToday();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [goToToday]);

  // 휠 이벤트 핸들러 추가
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (event: WheelEvent) => {
      // 기본 스크롤 동작 허용
      event.stopPropagation();
    };

    container.addEventListener('wheel', handleWheel, { passive: true });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // 할일 추가 핸들러 (날짜 지정)
  const handleAddTodo = (date: Date) => (title: string, categoryId: string) => {
    addTodo(title, date, categoryId);
  };

  const { days, selectedDayIndex } = dailyData;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const selectedDayRef = useRef<HTMLDivElement>(null);
  const dayRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Intersection Observer를 사용한 스크롤 기반 날짜 선택
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let timeoutId: NodeJS.Timeout | null = null;
    const currentDebounceTimer = debounceTimerRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        // 가장 많이 보이는 날짜 찾기
        let maxRatio = 0;
        let mostVisibleDate: Date | null = null;

        entries.forEach((entry) => {
          if (entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio;
            const dateKey = entry.target.getAttribute('data-date');
            if (dateKey) {
              mostVisibleDate = new Date(dateKey);
            }
          }
        });

        if (mostVisibleDate && maxRatio > 0.3) {
          setVisibleDate(mostVisibleDate);
          
          // 디바운스 타이머 취소
          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
          }
          
          // 이전 타이머 취소
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          
          // 선택된 날짜도 업데이트 (부드러운 변경을 위해 약간의 지연)
          timeoutId = setTimeout(() => {
            goToDate(mostVisibleDate!);
            timeoutId = null;
          }, 150);
        }
      },
      {
        root: container,
        rootMargin: '-20% 0px -20% 0px', // 중앙 60% 영역에서만 감지
        threshold: [0.1, 0.3, 0.5, 0.7]
      }
    );

    // 모든 날짜 섹션을 관찰
    dayRefs.current.forEach((element) => {
      observer.observe(element);
    });

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (currentDebounceTimer) {
        clearTimeout(currentDebounceTimer);
      }
      observer.disconnect();
    };
  }, [days, goToDate]);

  // 선택된 날짜로 스크롤하기 (초기 로드 및 오늘 버튼 클릭 시)
  useEffect(() => {
    if (selectedDayRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const selectedElement = selectedDayRef.current;

      const containerHeight = container.clientHeight;
      const selectedTop = selectedElement.offsetTop;
      const selectedHeight = selectedElement.clientHeight;

      // 선택된 요소를 화면 중앙에 위치시키기
      const scrollTop = selectedTop - (containerHeight / 2) + (selectedHeight / 2);

      container.scrollTo({
        top: scrollTop,
        behavior: 'smooth'
      });
    }
  }, [selectedDate]);

  // dayRefs 설정 콜백
  const setDayRef = useCallback((date: Date, element: HTMLDivElement | null) => {
    const dateKey = date.toISOString();
    if (element) {
      dayRefs.current.set(dateKey, element);
    } else {
      dayRefs.current.delete(dateKey);
    }
  }, []);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* 메인 콘텐츠: 세로 스크롤 */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-scroll overflow-x-hidden"
        style={{
          scrollBehavior: 'smooth',
          minHeight: '0',
          height: 'calc(100vh - 140px)',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <div className="max-w-4xl mx-auto p-6 space-y-8" style={{ minHeight: 'calc(200vh)' }}>
          {days.map((dayData, index) => {
            const isSelectedDay = index === selectedDayIndex;
            const isTodayActual = isToday(dayData.date);
            const dateKey = dayData.date.toISOString();

            return (
              <div
                key={dayData.date.getTime()}
                data-date={dateKey}
                ref={(element) => {
                  if (isSelectedDay) {
                    selectedDayRef.current = element;
                  }
                  setDayRef(dayData.date, element);
                }}
                className={`transition-all duration-200 min-h-[600px] ${isSelectedDay
                    ? 'border-l-4 border-blue-500 pl-4'
                    : 'pl-4'
                  }`}
              >
                <DaySection
                  dayData={dayData}
                  categories={categories}
                  onAddTodo={handleAddTodo(dayData.date)}
                  onToggleTodo={toggleTodo}
                  onDeleteTodo={deleteTodo}
                  isMainSection={isSelectedDay}
                  isToday={isTodayActual}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
