"use client";

import { ReactNode } from 'react';
import { useResponsive } from '@/hooks/useResponsive';
import { TodoSidebar } from '@/components/todo/TodoSidebar';
import { DesktopSidePanel } from './DesktopSidePanel';
import { MobileBottomSheet } from './MobileBottomSheet';
import { TabletSidePanel } from './TabletSidePanel';

interface ResponsiveTodoInterfaceProps {
  isOpen: boolean;
  selectedDate: Date | undefined;
  onClose: () => void;
  calendarContent: ReactNode;
}

export const ResponsiveTodoInterface = ({
  isOpen,
  selectedDate,
  onClose,
  calendarContent
}: ResponsiveTodoInterfaceProps) => {
  const { screenSize, isDesktopOrWider } = useResponsive();

  const renderTodoInterface = () => {
    switch (screenSize) {
      case 'mobile':
        return (
          <MobileBottomSheet
            isOpen={isOpen}
            selectedDate={selectedDate}
            onClose={onClose}
          />
        );
      case 'tablet':
        return (
          <TabletSidePanel
            isOpen={isOpen}
            selectedDate={selectedDate}
            onClose={onClose}
          />
        );
      case 'desktop':
      case 'wide':
        return (
          <DesktopSidePanel
            isOpen={isOpen}
            selectedDate={selectedDate}
            onClose={onClose}
          />
        );
      default:
        return (
          <TodoSidebar
            isOpen={isOpen}
            selectedDate={selectedDate}
            onClose={onClose}
          />
        );
    }
  };

  // 데스크톱/와이드 화면에서 사이드바가 열린 경우, 오버레이 방식으로 처리
  if (isDesktopOrWider) {
    return (
      <>
        {/* 캘린더 영역 - width 직접 제어로 실제 크기 조절 */}
        <div 
          className="h-full transition-all duration-200 ease-out"
          style={{
            width: isOpen ? 'calc(100% - 384px)' : '100%'
          }}
        >
          {calendarContent}
        </div>
        
        {/* 사이드바 - absolute 위치에서 transform으로 슬라이드 */}
        <div 
          className={`absolute top-0 right-0 w-96 h-full transform transition-transform duration-200 ease-out ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {renderTodoInterface()}
        </div>
      </>
    );
  }

  // 다른 경우는 기존 방식 유지
  return (
    <>
      <div className="w-full h-full">
        {calendarContent}
      </div>
      {renderTodoInterface()}
    </>
  );
};