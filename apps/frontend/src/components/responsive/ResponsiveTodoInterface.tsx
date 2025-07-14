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

  // 데스크톱/와이드 화면에서 사이드바가 열린 경우, Flexbox로 레이아웃 구성
  if (isDesktopOrWider && isOpen) {
    return (
      <>
        <div className="flex-1 min-w-0">
          {calendarContent}
        </div>
        <div className="w-96 flex-shrink-0">
          {renderTodoInterface()}
        </div>
      </>
    );
  }

  // 다른 경우는 기존 방식 유지
  return (
    <>
      {calendarContent}
      {renderTodoInterface()}
    </>
  );
};