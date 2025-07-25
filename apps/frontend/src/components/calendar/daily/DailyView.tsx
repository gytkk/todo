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

  const { days, selectedDayIndex } = dailyData;

  // 초기 스크롤을 위한 간단하고 확실한 방법
  useEffect(() => {
    if (isInitialMount.current && days.length === 61) { // 모든 날짜가 로드되었을 때
      const scrollToToday = () => {
        const container = scrollContainerRef.current;
        if (!container) return;
        
        // 오늘 날짜 요소 찾기 (인덱스 30 = 오늘)
        const todayDateKey = selectedDate.toISOString();
        const todayElement = container.querySelector(`[data-date="${todayDateKey}"]`) as HTMLElement;
        
        if (todayElement) {
          // 헤더가 보이도록 스크롤 위치 조정
          const containerHeight = container.clientHeight;
          const selectedTop = todayElement.offsetTop;
          // 헤더를 보이게 하기 위해 더 적은 오프셋 사용 (헤더 높이 + 여백 고려)
          const scrollTop = Math.max(0, selectedTop - 120); // 헤더(60px) + 여백(60px)
          
          console.log('=== DailyView 초기 스크롤 실행 ===');
          console.log('오늘 날짜:', selectedDate.toISOString().split('T')[0]);
          console.log('선택된 요소 위치(selectedTop):', selectedTop);
          console.log('계산된 스크롤 위치(scrollTop):', scrollTop);
          console.log('컨테이너 높이(clientHeight):', containerHeight);
          console.log('스크롤 높이(scrollHeight):', container.scrollHeight);
          console.log('스크롤 가능 여부:', container.scrollHeight > containerHeight);
          console.log('스크롤 전 위치:', container.scrollTop);
          
          container.scrollTop = scrollTop;
          
          console.log('스크롤 후 위치:', container.scrollTop);
          console.log('스크롤 성공 여부:', container.scrollTop === scrollTop);
          console.log('==============================');
          
          isInitialMount.current = false;
          setScrollBehavior('smooth');
          
          // 키보드 이벤트를 받을 수 있도록 포커스 주기
          container.focus();
        } else {
          console.log('DailyView: 오늘 날짜 요소를 찾을 수 없음!', {
            selectedDate: selectedDate.toISOString().split('T')[0],
            daysLength: days.length,
            selectedDayIndex: selectedDayIndex
          });
        }
      };

      // 충분한 지연 후 스크롤 실행
      const timer = setTimeout(scrollToToday, 200);
      return () => clearTimeout(timer);
    }
  }, [selectedDate, days.length]);

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
        event.target instanceof HTMLTextAreaElement ||
        (event.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      const container = scrollContainerRef.current;
      if (!container) return;

      switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          event.stopPropagation();
          
          console.log('키보드 스크롤: 위로 시도', {
            currentScrollTop: container.scrollTop,
            scrollHeight: container.scrollHeight,
            clientHeight: container.clientHeight,
            scrollBehavior: scrollBehavior
          });
          
          // 여러 방법으로 스크롤 시도
          const beforeScrollTop = container.scrollTop;
          
          // 방법 1: scrollBy 시도
          container.scrollBy({ top: -200, behavior: 'auto' });
          
          // 방법 2: scrollBy가 안되면 직접 scrollTop 조작
          setTimeout(() => {
            if (container.scrollTop === beforeScrollTop) {
              console.log('scrollBy 실패, scrollTop 직접 조작 시도');
              container.scrollTop = Math.max(0, beforeScrollTop - 200);
            }
            
            console.log('스크롤 결과:', {
              before: beforeScrollTop,
              after: container.scrollTop,
              changed: beforeScrollTop !== container.scrollTop
            });
          }, 10);
          
          break;
        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault();
          event.stopPropagation();
          
          console.log('키보드 스크롤: 아래로 시도', {
            currentScrollTop: container.scrollTop,
            scrollHeight: container.scrollHeight,
            clientHeight: container.clientHeight,
            scrollBehavior: scrollBehavior
          });
          
          // 여러 방법으로 스크롤 시도
          const beforeScrollDown = container.scrollTop;
          const maxScroll = container.scrollHeight - container.clientHeight;
          
          // 방법 1: scrollBy 시도
          container.scrollBy({ top: 200, behavior: 'auto' });
          
          // 방법 2: scrollBy가 안되면 직접 scrollTop 조작
          setTimeout(() => {
            if (container.scrollTop === beforeScrollDown) {
              console.log('scrollBy 실패, scrollTop 직접 조작 시도');
              container.scrollTop = Math.min(maxScroll, beforeScrollDown + 200);
            }
            
            console.log('스크롤 결과:', {
              before: beforeScrollDown,
              after: container.scrollTop,
              changed: beforeScrollDown !== container.scrollTop,
              maxScroll: maxScroll
            });
          }, 10);
          
          break;
        case 't':
        case 'T':
          event.preventDefault();
          event.stopPropagation();
          goToToday();
          console.log('키보드: 오늘로 이동');
          break;
      }
    };

    // document와 스크롤 컨테이너 모두에 이벤트 리스너 추가
    document.addEventListener('keydown', handleKeyDown);
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (container) {
        container.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [goToToday, scrollBehavior]);

  // CSS Grid 레이아웃이 제대로 작동하면 자연스러운 스크롤이 가능해야 함

  // 할일 추가 핸들러 (날짜 지정)
  const handleAddTodo = (date: Date) => (title: string, categoryId: string) => {
    addTodo(title, date, categoryId);
  };
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

  // 선택된 날짜 ref 설정 (날짜 변경 시 스크롤)
  const setSelectedDayRef = useCallback((element: HTMLDivElement | null, isSelectedDay: boolean) => {
    if (isSelectedDay && element) {
      selectedDayRef.current = element;
      
      // 초기 마운트가 아닌 경우에만 스크롤 (날짜 변경 시)
      if (!isInitialMount.current && scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const selectedTop = element.offsetTop;
        const scrollTop = Math.max(0, selectedTop - 120); // 헤더(60px) + 여백(60px)
        
        container.scrollTo({
          top: scrollTop,
          behavior: 'smooth'
        });
      }
    }
  }, [selectedDate]);

  return (
    <div className="w-full h-full bg-gray-50">
      {/* 메인 콘텐츠: 세로 스크롤 */}
      <div
        ref={scrollContainerRef}
        className="w-full overflow-y-scroll overflow-x-hidden focus:outline-none"
        style={{
          scrollBehavior: scrollBehavior,
          height: '80vh', // 뷰포트 높이의 80%로 강제 제한
          maxHeight: '80vh',
          WebkitOverflowScrolling: 'touch'
        }}
        tabIndex={0}
        onFocus={() => console.log('스크롤 컨테이너 포커스 받음')}
        onClick={() => {
          // 클릭 시 포커스 주기
          scrollContainerRef.current?.focus();
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
