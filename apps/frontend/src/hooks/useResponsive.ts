"use client";

import { useState, useEffect } from 'react';

export type ScreenSize = 'mobile' | 'tablet' | 'desktop' | 'wide';

export interface ResponsiveBreakpoints {
  mobile: number;
  tablet: number;
  desktop: number;
  wide: number;
}

const DEFAULT_BREAKPOINTS: ResponsiveBreakpoints = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  wide: 1440,
};

export const useResponsive = (breakpoints: ResponsiveBreakpoints = DEFAULT_BREAKPOINTS) => {
  const [screenSize, setScreenSize] = useState<ScreenSize>('desktop');
  const [windowWidth, setWindowWidth] = useState<number>(0);

  useEffect(() => {
    const getScreenSize = (width: number): ScreenSize => {
      if (width >= breakpoints.wide) return 'wide';
      if (width >= breakpoints.desktop) return 'desktop';
      if (width >= breakpoints.tablet) return 'tablet';
      return 'mobile';
    };

    const handleResize = () => {
      const width = window.innerWidth;
      setWindowWidth(width);
      setScreenSize(getScreenSize(width));
    };

    // Initial setup
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [breakpoints]);

  return {
    screenSize,
    windowWidth,
    isMobile: screenSize === 'mobile',
    isTablet: screenSize === 'tablet',
    isDesktop: screenSize === 'desktop',
    isWide: screenSize === 'wide',
    isDesktopOrWider: screenSize === 'desktop' || screenSize === 'wide',
    isTabletOrWider: screenSize === 'tablet' || screenSize === 'desktop' || screenSize === 'wide',
  };
};