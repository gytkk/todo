"use client";

import { ReactNode } from 'react';
import { useResponsive } from '@/hooks/useResponsive';

interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
  sidebarOpen?: boolean;
}

export const ResponsiveContainer = ({ 
  children, 
  className = '', 
  sidebarOpen = false 
}: ResponsiveContainerProps) => {
  const { screenSize, isDesktopOrWider } = useResponsive();

  // 고정 레이아웃 사용 - flex로 인한 레이아웃 변화 방지
  const getLayoutClasses = () => {
    return 'relative h-full';
  };

  return (
    <div className={`${getLayoutClasses()} ${className}`} data-screen-size={screenSize}>
      {children}
    </div>
  );
};