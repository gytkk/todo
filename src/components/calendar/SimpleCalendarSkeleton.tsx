"use client";

import { memo } from 'react';

function SimpleCalendarSkeletonComponent() {
  return (
    <div className="h-full p-4 bg-white">
      <div className="h-full animate-pulse">
        {/* 간단한 로딩 인디케이터 */}
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="h-8 w-32 bg-gray-200 rounded mb-4 mx-auto"></div>
            <div className="h-4 w-24 bg-gray-100 rounded mx-auto"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const SimpleCalendarSkeleton = memo(SimpleCalendarSkeletonComponent);