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

  // Flexbox layout for desktop/wide screens when sidebar is open
  const getLayoutClasses = () => {
    if (isDesktopOrWider && sidebarOpen) {
      return 'flex h-full'; // Flexbox 사용
    }
    return 'h-full';
  };

  return (
    <div className={`${getLayoutClasses()} ${className}`} data-screen-size={screenSize}>
      {children}
    </div>
  );
};