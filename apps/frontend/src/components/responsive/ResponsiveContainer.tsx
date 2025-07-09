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

  // CSS Grid layout for desktop/wide screens when sidebar is open
  const getLayoutClasses = () => {
    if (isDesktopOrWider && sidebarOpen) {
      return 'grid grid-cols-[1fr_384px] h-full'; // 384px = w-96
    }
    return 'h-full';
  };

  return (
    <div className={`${getLayoutClasses()} ${className}`} data-screen-size={screenSize}>
      {children}
    </div>
  );
};