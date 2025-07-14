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
  
  // Observer 재활성화 타이머를 추적하는 ref
  const observerActivationTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // 초기 스크롤 완료 여부를 추적하는 ref
  const initialScrollCompleted = useRef(false);

  // 컴포넌트가 처음 마운트되었는지 추적하는 ref
  const isInitialMount = useRef(true);
  
  // 스크롤 애니메이션 제어를 위한 상태 (초기에는 auto, 이후 smooth)
  const [scrollBehavior, setScrollBehavior] = useState<'auto' | 'smooth'>('auto');

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
          container.scrollBy({ top: -200, behavior: scrollBehavior });
          break;
        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault();
          container.scrollBy({ top: 200, behavior: scrollBehavior });
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
  }, [goToToday, scrollBehavior]);

  // CSS Grid 레이아웃이 제대로 작동하면 자연스러운 스크롤이 가능해야 함

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

        // 초기 스크롤이 완료되지 않았으면 Observer 콜백을 무시
        if (!initialScrollCompleted.current) {
          return;
        }
        
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
          
          // 선택된 날짜도 업데이트 (프로그래매틱 스크롤 중이 아닐 때만)
          timeoutId = setTimeout(() => {
            // 프로그래매틱 스크롤이 완료된 후에만 날짜 변경
            if (initialScrollCompleted.current) {
              goToDate(mostVisibleDate!);
            }
            timeoutId = null;
          }, 200); // 스크롤 애니메이션과 조화
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

  // 선택된 날짜로 스크롤하기 (모든 날짜 변경 시)
  useEffect(() => {
    // 이전 Observer 재활성화 타이머 정리
    if (observerActivationTimerRef.current) {
      clearTimeout(observerActivationTimerRef.current);
    }
    
    // 날짜가 변경될 때마다 Observer 비활성화
    initialScrollCompleted.current = false;
    
    // 약간의 지연을 주어 렌더링이 완료된 후 스크롤
    const scrollToSelectedDate = () => {
      if (selectedDayRef.current && scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const selectedElement = selectedDayRef.current;

        const selectedTop = selectedElement.offsetTop;

        // 선택된 요소를 화면 상단에 위치시키기
        const scrollTop = Math.max(0, selectedTop - 20); // 20px 여백만 추가

        // 초기 마운트 여부를 미리 확인
        const isInitial = isInitialMount.current;
        
        // 초기 로딩 시에는 애니메이션 없이, 이후에는 부드러운 애니메이션
        container.scrollTo({
          top: scrollTop,
          behavior: isInitial ? 'auto' : 'smooth'
        });
        
        // 초기 마운트 플래그 해제 및 애니메이션 활성화
        if (isInitial) {
          isInitialMount.current = false;
          // 초기 스크롤 완료 후 부드러운 애니메이션 활성화
          setTimeout(() => {
            setScrollBehavior('smooth');
          }, 100);
        }
        
        // 스크롤 완료 후 Observer 활성화 (초기 로딩 시 빠르게, 이후 애니메이션 시간 고려)
        observerActivationTimerRef.current = setTimeout(() => {
          initialScrollCompleted.current = true;
          observerActivationTimerRef.current = null;
        }, isInitial ? 50 : 300); // 초기 로딩은 빠르게, 애니메이션 시에는 완료 대기
      }
    };

    // DOM이 업데이트된 후 즉시 스크롤 실행 (requestAnimationFrame 사용)
    const frameId = requestAnimationFrame(scrollToSelectedDate);

    return () => {
      cancelAnimationFrame(frameId);
    };
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
        className="flex-1 overflow-y-auto overflow-x-hidden"
        style={{
          scrollBehavior: scrollBehavior,
          minHeight: '0',
          maxHeight: '100%',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          touchAction: 'pan-y'
        }}
      >
        <div className="max-w-4xl mx-auto p-6 space-y-8">
          {days.map((dayData, index) => {
            const isSelectedDay = index === selectedDayIndex;
            const isTodayActual = isToday(dayData.date);
            const dateKey = dayData.date.toISOString();

            return (
              <div
                key={dateKey}
                data-date={dateKey}
                ref={(element) => {
                  if (isSelectedDay) {
                    selectedDayRef.current = element;
                  }
                  setDayRef(dayData.date, element);
                }}
                className={`min-h-[400px] pl-4 ${isSelectedDay
                    ? 'border-l-4 border-blue-500'
                    : ''
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
