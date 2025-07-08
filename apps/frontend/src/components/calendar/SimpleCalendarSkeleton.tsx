"use client";

import { memo } from 'react';
import { CalendarLoading } from '@/components/ui/loading';

function SimpleCalendarSkeletonComponent() {
  return <CalendarLoading />;
}

export const SimpleCalendarSkeleton = memo(SimpleCalendarSkeletonComponent);