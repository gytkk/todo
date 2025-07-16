"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { DaySection } from './DaySection';
import { useDailyView } from './hooks/useDailyView';
import { useTodoContext, useCategoryContext } from '@/contexts/AppContext';

interface DailyViewProps {
  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
}

const DailyViewComponent: React.FC<DailyViewProps> = ({
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
  
  // 컴포넌트가 마운트될 때마다 초기화
  useEffect(() => {
    isInitialMount.current = true;
    console.log('DailyView 마운트: isInitialMount을 true로 설정');
  }, []);
  
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

  // 날짜 변경 시 부모 컴포넌트에 알림 (초기 마운트 시에는 호출하지 않음)
  const lastSelectedDateRef = useRef<Date | undefined>(undefined);
  
  useEffect(() => {
    if (onDateChange && lastSelectedDateRef.current) {
      // 실제로 날짜가 변경되었을 때만 호출
      if (lastSelectedDateRef.current.getTime() !== selectedDate.getTime()) {
        onDateChange(selectedDate);
      }
    }
    lastSelectedDateRef.current = selectedDate;
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
          
          
          // 선택된 날짜도 업데이트 (프로그래매틱 스크롤 중이 아닐 때만)
          debounceTimerRef.current = setTimeout(() => {
            // 프로그래매틱 스크롤이 완료된 후에만 날짜 변경
            if (initialScrollCompleted.current) {
              goToDate(mostVisibleDate!);
            }
            debounceTimerRef.current = null;
          }, 300); // 디바운스 시간 증가로 안정성 향상
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
      if (currentDebounceTimer) {
        clearTimeout(currentDebounceTimer);
      }
      observer.disconnect();
    };
  }, [days, goToDate]);

  // Observer 재활성화 관리
  useEffect(() => {
    // 날짜가 변경될 때마다 Observer 비활성화
    initialScrollCompleted.current = false;
    
    // Observer 활성화 타이머 설정
    const activationDelay = isInitialMount.current ? 200 : 500;
    observerActivationTimerRef.current = setTimeout(() => {
      initialScrollCompleted.current = true;
      observerActivationTimerRef.current = null;
    }, activationDelay);

    return () => {
      if (observerActivationTimerRef.current) {
        clearTimeout(observerActivationTimerRef.current);
      }
    };
  }, [selectedDate, selectedDayIndex]);

  // dayRefs 설정 콜백
  const setDayRef = useCallback((date: Date, element: HTMLDivElement | null) => {
    const dateKey = date.toISOString();
    if (element) {
      dayRefs.current.set(dateKey, element);
    } else {
      dayRefs.current.delete(dateKey);
    }
  }, []);

  // 선택된 날짜 ref 설정 시 스크롤 트리거
  const setSelectedDayRef = useCallback((element: HTMLDivElement | null, isSelectedDay: boolean) => {
    console.log('DailyView setSelectedDayRef 호출:', {
      isSelectedDay,
      hasElement: !!element,
      isInitialMount: isInitialMount.current,
      selectedDate: selectedDate.toISOString().split('T')[0],
      selectedDayIndex
    });
    
    if (isSelectedDay && element) {
      selectedDayRef.current = element;
      
      // 초기 마운트 시에만 스크롤
      if (isInitialMount.current && scrollContainerRef.current) {
        console.log('DailyView 초기 스크롤 시작...');
        
        // 즉시 스크롤 실행
        const container = scrollContainerRef.current;
        const selectedElement = element;
        
        if (container && selectedElement) {
          const selectedTop = selectedElement.offsetTop;
          const scrollTop = Math.max(0, selectedTop - 20);
          
          console.log('DailyView 초기 스크롤 실행:', {
            selectedDate: selectedDate.toISOString().split('T')[0],
            selectedDayIndex,
            selectedTop,
            scrollTop,
            containerHeight: container.clientHeight,
            containerScrollHeight: container.scrollHeight
          });
          
          // 직접 scrollTop 속성 사용
          container.scrollTop = scrollTop;
          
          // 스크롤 후 확인
          setTimeout(() => {
            console.log('DailyView 스크롤 후 확인:', {
              actualScrollTop: container.scrollTop,
              targetScrollTop: scrollTop,
              success: Math.abs(container.scrollTop - scrollTop) < 50
            });
          }, 100);
          
          // 초기 마운트 플래그 해제 및 애니메이션 활성화
          isInitialMount.current = false;
          setTimeout(() => {
            setScrollBehavior('smooth');
          }, 200);
        }
      } else if (!isInitialMount.current && scrollContainerRef.current) {
        // 초기 마운트가 아닌 경우 (날짜 변경 시)
        requestAnimationFrame(() => {
          const container = scrollContainerRef.current;
          const selectedElement = selectedDayRef.current;
          
          if (container && selectedElement) {
            const selectedTop = selectedElement.offsetTop;
            const scrollTop = Math.max(0, selectedTop - 20);
            
            container.scrollTo({
              top: scrollTop,
              behavior: 'smooth'
            });
          }
        });
      }
    }
  }, [selectedDate, selectedDayIndex]);

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
          WebkitOverflowScrolling: 'touch'
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
                  setSelectedDayRef(element, isSelectedDay);
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

export const DailyView = React.memo(DailyViewComponent);
