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
  const { screenSize } = useResponsive();

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

  return (
    <>
      {calendarContent}
      {renderTodoInterface()}
    </>
  );
};