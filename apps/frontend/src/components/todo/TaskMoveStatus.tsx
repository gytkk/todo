"use client";

import React from 'react';
import { useTaskMover } from '@/hooks/useTaskMover';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { CheckCircle, Clock, ArrowRight } from 'lucide-react';

export const TaskMoveStatus: React.FC = () => {
  const { isMoving, lastMoveResult } = useTaskMover();

  // 이동 중이거나 최근 결과가 없으면 표시하지 않음
  if (!isMoving && !lastMoveResult) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40 max-w-sm">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
        {isMoving ? (
          <div className="flex items-center gap-3">
            <LoadingSpinner size="sm" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                작업 이동 중...
              </p>
              <p className="text-xs text-gray-500">
                미완료 작업을 확인하고 있습니다
              </p>
            </div>
          </div>
        ) : lastMoveResult && (
          <div className="flex items-center gap-3">
            {lastMoveResult.movedCount > 0 ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    작업 이동 완료
                  </p>
                  <p className="text-xs text-gray-500">
                    {lastMoveResult.movedCount}개 작업이 오늘로 이동됨
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400" />
                <Clock className="h-4 w-4 text-blue-500" />
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    이동할 작업 없음
                  </p>
                  <p className="text-xs text-gray-500">
                    모든 작업이 최신 상태입니다
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskMoveStatus;