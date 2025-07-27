"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { DaySection } from './DaySection';
import { useDailyView } from './hooks/useDailyView';
import { useTodoContext, useCategoryContext } from '@/contexts/AppContext';
import { TodoType } from '@calendar-todo/shared-types';

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

  // 스크롤 기반 날짜 선택을 위한 상태 (비활성화됨)
  // const [, setVisibleDate] = useState<Date>(initialDate || new Date());
  
  // 디바운스를 위한 ref (비활성화됨)
  // const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Observer 재활성화 타이머를 추적하는 ref (비활성화됨)
  // const observerActivationTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // 초기 스크롤 완료 여부를 추적하는 ref (비활성화됨)
  // const initialScrollCompleted = useRef(false);

  // 컴포넌트가 처음 마운트되었는지 추적하는 ref
  const isInitialMount = useRef(true);

  // 사용자가 현재 스크롤 중인지 추적하는 ref
  const isUserScrolling = useRef(false);
  
  // 스크롤 완료를 감지하는 타이머 ref
  const scrollEndTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // 프로그래매틱 스크롤 실행 중인지 추적하는 ref
  const isProgrammaticScrolling = useRef(false);
  
  // 컴포넌트가 마운트될 때마다 초기화
  useEffect(() => {
    isInitialMount.current = true;
  }, []);

  // 스크롤 애니메이션 제어를 위한 상태 (초기에는 auto, 이후 smooth)
  const [scrollBehavior, setScrollBehavior] = useState<'auto' | 'smooth'>('auto');
  
  // 초기 로딩 완료 상태
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);

  // 이미 필터링된 todos를 받으므로 추가 필터링 불필요
  const {
    dailyData,
    selectedDate,
    goToToday,
    // goToDate, // 현재 DailyView 내부에서 직접 사용하지 않음
    isToday
  } = useDailyView(initialDate, todos);

  const { days, selectedDayIndex } = dailyData;

  // 초기 스크롤을 위한 최적화된 방법
  useEffect(() => {
    if (isInitialMount.current && days.length === 61) { // 모든 날짜가 로드되었을 때
      const scrollToToday = () => {
        const container = scrollContainerRef.current;
        if (!container) return;
        
        // 선택된 날짜 요소 찾기 (인덱스 30 = 선택된 날짜)
        const selectedDateKey = selectedDate.toISOString();
        const selectedElement = container.querySelector(`[data-date="${selectedDateKey}"]`) as HTMLElement;
        
        if (selectedElement) {
          // 스크롤 위치 조정
          const selectedTop = selectedElement.offsetTop;
          const scrollTop = Math.max(0, selectedTop - 20); // 최소 여백만 적용
          
          // 프로그래매틱 스크롤임을 표시
          isProgrammaticScrolling.current = true;
          
          // 즉시 스크롤 실행 (지연 없음)
          container.scrollTop = scrollTop;
          
          // 스크롤 완료 후 플래그 해제
          setTimeout(() => {
            isProgrammaticScrolling.current = false;
          }, 50);
          
          isInitialMount.current = false;
          setScrollBehavior('smooth');
          setIsInitialLoadComplete(true); // 초기 로딩 완료 표시
          
          // 키보드 이벤트를 받을 수 있도록 포커스 주기
          container.focus();
        }
      };

      // 즉시 실행 또는 최소 지연
      if (scrollContainerRef.current) {
        scrollToToday();
      } else {
        // 컨테이너가 아직 없는 경우에만 최소 지연
        const timer = setTimeout(scrollToToday, 50);
        return () => clearTimeout(timer);
      }
    }
  }, [selectedDate, days.length]);

  // 날짜가 변경될 때 스크롤 위치를 업데이트하는 함수
  const scrollToSelectedDate = useCallback((targetDate: Date) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const dateKey = targetDate.toISOString();
    const targetElement = container.querySelector(`[data-date="${dateKey}"]`) as HTMLElement;
    
    if (targetElement) {
      const selectedTop = targetElement.offsetTop;
      const scrollTop = Math.max(0, selectedTop - 20); // 최소 여백만 적용
      
      // 프로그래매틱 스크롤임을 표시
      isProgrammaticScrolling.current = true;
      
      container.scrollTo({
        top: scrollTop,
        behavior: 'smooth'
      });
      
      // 스크롤 애니메이션 완료 후 플래그 해제
      setTimeout(() => {
        isProgrammaticScrolling.current = false;
      }, 600);
    }
  }, []);

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

  // 선택된 날짜가 변경될 때 스크롤 위치 업데이트 (네비게이션 버튼 클릭 시)
  useEffect(() => {
    // 초기 마운트가 완료된 후에는 항상 스크롤 업데이트
    // 네비게이션 버튼 클릭 시에는 사용자 스크롤 상태와 관계없이 이동해야 함
    if (!isInitialMount.current) {
      scrollToSelectedDate(selectedDate);
    }
  }, [selectedDate, scrollToSelectedDate]);


  // 카테고리 변경 이벤트 리스너
  useEffect(() => {
    const handleCategoryChange = async () => {
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
          
          // 키보드 스크롤도 프로그래매틱 스크롤로 취급
          isProgrammaticScrolling.current = true;
          
          // 여러 방법으로 스크롤 시도
          const beforeScrollTop = container.scrollTop;
          
          // 방법 1: scrollBy 시도
          container.scrollBy({ top: -200, behavior: 'auto' });
          
          // 방법 2: scrollBy가 안되면 직접 scrollTop 조작
          setTimeout(() => {
            if (container.scrollTop === beforeScrollTop) {
              container.scrollTop = Math.max(0, beforeScrollTop - 200);
            }
            // 키보드 스크롤 완료 후 플래그 해제
            setTimeout(() => {
              isProgrammaticScrolling.current = false;
            }, 100);
          }, 10);
          
          break;
        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault();
          event.stopPropagation();
          
          // 키보드 스크롤도 프로그래매틱 스크롤로 취급
          isProgrammaticScrolling.current = true;
          
          // 여러 방법으로 스크롤 시도
          const beforeScrollDown = container.scrollTop;
          const maxScroll = container.scrollHeight - container.clientHeight;
          
          // 방법 1: scrollBy 시도
          container.scrollBy({ top: 200, behavior: 'auto' });
          
          // 방법 2: scrollBy가 안되면 직접 scrollTop 조작
          setTimeout(() => {
            if (container.scrollTop === beforeScrollDown) {
              container.scrollTop = Math.min(maxScroll, beforeScrollDown + 200);
            }
            // 키보드 스크롤 완료 후 플래그 해제
            setTimeout(() => {
              isProgrammaticScrolling.current = false;
            }, 100);
          }, 10);
          
          break;
        case 't':
        case 'T':
          event.preventDefault();
          event.stopPropagation();
          goToToday();
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

  // 사용자 스크롤 감지 이벤트 리스너
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleUserScroll = () => {
      // 프로그래매틱 스크롤인 경우 사용자 스크롤로 취급하지 않음
      if (isProgrammaticScrolling.current) {
        return;
      }
      
      // 사용자가 스크롤 중임을 표시
      isUserScrolling.current = true;
      
      // 기존 타이머가 있으면 취소
      if (scrollEndTimerRef.current) {
        clearTimeout(scrollEndTimerRef.current);
      }
      
      // 스크롤이 끝난 후 500ms 후에 플래그 해제
      scrollEndTimerRef.current = setTimeout(() => {
        isUserScrolling.current = false;
        scrollEndTimerRef.current = null;
      }, 500);
    };

    // 스크롤 이벤트 리스너 추가 (passive로 성능 최적화)
    container.addEventListener('scroll', handleUserScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleUserScroll);
      if (scrollEndTimerRef.current) {
        clearTimeout(scrollEndTimerRef.current);
      }
    };
  }, []);

  // CSS Grid 레이아웃이 제대로 작동하면 자연스러운 스크롤이 가능해야 함

  // 할일 추가 핸들러 (날짜 지정)
  const handleAddTodo = (date: Date) => (title: string, categoryId: string, todoType: TodoType) => {
    addTodo(title, date, categoryId, todoType);
  };
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const selectedDayRef = useRef<HTMLDivElement>(null);
  const dayRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Intersection Observer를 사용한 스크롤 기반 날짜 선택 (비활성화됨)
  // 스크롤로 인한 날짜 자동 변경을 방지하기 위해 주석 처리
  /*
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const currentDebounceTimer = debounceTimerRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        // 초기 스크롤이 완료되지 않았으면 Observer 콜백을 무시
        if (!initialScrollCompleted.current) {
          return;
        }

        // 가장 많이 보이는 날짜 찾기
        let maxRatio = 0;
        let mostVisibleElement: Element | null = null;

        entries.forEach((entry) => {
          if (entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio;
            mostVisibleElement = entry.target;
          }
        });

        if (mostVisibleElement && maxRatio > 0.5) { // 임계값을 0.5로 높여서 더 확실할 때만 변경
          const element = mostVisibleElement as HTMLElement; // HTMLElement로 타입 캐스팅
          const dateKey = element.getAttribute('data-date');
          if (dateKey) {
            const mostVisibleDate = new Date(dateKey);
            // 현재 선택된 날짜와 다를 때만 변경
            if (mostVisibleDate.toDateString() !== selectedDate.toDateString()) {
              setVisibleDate(mostVisibleDate);
              
              // 디바운스 타이머 취소
              if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
              }
              
              // 선택된 날짜도 업데이트
              debounceTimerRef.current = setTimeout(() => {
                if (initialScrollCompleted.current) {
                  // 스크롤 기반 날짜 변경이므로 자동 스크롤 방지
                  goToDate(mostVisibleDate);
                }
                debounceTimerRef.current = null;
              }, 200); // 디바운스 시간 단축으로 반응성 향상
            }
          }
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
  }, [days, goToDate, selectedDate]);
  */

  // Observer 재활성화 관리 (비활성화됨)
  // Intersection Observer가 비활성화되어 있으므로 이 useEffect도 주석 처리
  /*
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
  }, [selectedDayIndex]);
  */

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
      
      // 초기 마운트가 아니고, 사용자가 스크롤 중이 아닌 경우에만 자동 스크롤
      if (!isInitialMount.current && !isUserScrolling.current && scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const selectedTop = element.offsetTop;
        const scrollTop = Math.max(0, selectedTop - 20); // 최소 여백만 적용
        
        // 프로그래매틱 스크롤임을 표시
        isProgrammaticScrolling.current = true;
        
        container.scrollTo({
          top: scrollTop,
          behavior: 'smooth'
        });
        
        // 스크롤 애니메이션 완료 후 플래그 해제 (smooth 애니메이션은 보통 300-500ms)
        setTimeout(() => {
          isProgrammaticScrolling.current = false;
        }, 600);
      }
    }
  }, []);

  // 초기 로딩 중이면 로딩 상태 표시
  if (!isInitialLoadComplete && days.length < 61) {
    return (
      <div className="w-full h-full bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <div className="text-gray-500 text-sm">로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gray-50">
      {/* 메인 콘텐츠: 세로 스크롤 */}
      <div
        ref={scrollContainerRef}
        className={`w-full overflow-y-scroll overflow-x-hidden focus:outline-none transition-opacity duration-200 ${
          isInitialLoadComplete ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          scrollBehavior: scrollBehavior,
          height: '80vh', // 뷰포트 높이의 80%로 강제 제한
          maxHeight: '80vh',
          WebkitOverflowScrolling: 'touch'
        }}
        tabIndex={0}
        onFocus={() => {}}
        onClick={(e) => {
          // Input, textarea, button 등 포커스 가능한 요소를 클릭한 경우에는 스크롤 컨테이너에 포커스를 주지 않음
          const target = e.target as HTMLElement;
          const isInputElement = target.tagName === 'INPUT' || 
                                target.tagName === 'TEXTAREA' || 
                                target.tagName === 'BUTTON' ||
                                target.tagName === 'SELECT' ||
                                target.isContentEditable ||
                                target.closest('input, textarea, button, select, [contenteditable]');
          
          if (!isInputElement) {
            // 클릭 시 포커스 주기 (포커스 가능한 요소가 아닌 경우에만)
            scrollContainerRef.current?.focus();
          }
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
