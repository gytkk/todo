import { Skeleton, SkeletonCard, SkeletonList, SkeletonText } from './skeleton';

// Page level loading components
export function PageLoading() {
  return (
    <div className="min-h-screen bg-gray-50 animate-fadeIn">
      <div className="h-16 bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <Skeleton className="h-6 w-32" />
        </div>
      </div>
      <div className="flex">
        <div className="w-64 bg-white border-r border-gray-200 h-screen">
          <div className="p-4 space-y-4">
            <Skeleton className="h-8 w-full" />
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          </div>
        </div>
        <div className="flex-1 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Calendar specific loading
export function CalendarLoading() {
  return (
    <div className="h-full bg-white animate-fadeIn">
      {/* Calendar header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        <div className="flex space-x-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
      
      {/* Calendar grid */}
      <div className="p-4">
        <div className="grid grid-cols-7 gap-1 mb-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-24 border border-gray-100 p-1">
              <Skeleton className="h-4 w-6 mb-1" />
              <div className="space-y-1">
                {i % 3 === 0 && (
                  <Skeleton className="h-2 w-full" />
                )}
                {i % 5 === 0 && (
                  <Skeleton className="h-2 w-3/4" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Todo list loading
export function TodoListLoading() {
  return (
    <div className="space-y-3 animate-fadeIn">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200">
          <Skeleton className="h-4 w-4 rounded" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// Form loading
export function FormLoading() {
  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="flex space-x-2">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-16" />
      </div>
    </div>
  );
}

// Settings page loading
export function SettingsLoading() {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="border-b border-gray-200 pb-4">
        <Skeleton className="h-8 w-48 mb-2" />
        <SkeletonText lines={2} />
      </div>
      
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Statistics loading
export function StatisticsLoading() {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-16" />
              </div>
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>
        ))}
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  );
}

// Spinner component for smaller loading states
export function Spinner({ size = 'default', className }: { size?: 'sm' | 'default' | 'lg'; className?: string }) {
  const sizes = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div className={`${sizes[size]} ${className}`}>
      <div className="animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 h-full w-full"></div>
    </div>
  );
}

// Inline loading text
export function LoadingText({ text = "로딩 중..." }: { text?: string }) {
  return (
    <div className="flex items-center space-x-2 text-gray-500">
      <Spinner size="sm" />
      <span className="text-sm">{text}</span>
    </div>
  );
}