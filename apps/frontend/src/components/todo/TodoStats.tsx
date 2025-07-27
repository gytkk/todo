"use client";

import { TodoStats as TodoStatsType } from '@calendar-todo/shared-types';

interface TodoStatsProps {
  stats: TodoStatsType;
}

export function TodoStats({ stats }: TodoStatsProps) {
  if (stats.total === 0) return null;

  return (
    <div className="pt-4 border-t border-gray-100 space-y-3">
      {/* 전체 통계 */}
      <div className="flex justify-between text-sm text-gray-600">
        <span>전체: {stats.total}개</span>
        <span>완료: {stats.completed}개</span>
        <span>미완료: {stats.incomplete}개</span>
      </div>
      
      {/* 완료율 */}
      <div className="flex justify-between text-sm text-gray-600">
        <span>완료율: {stats.completionRate}%</span>
        <span>최근 완료: {stats.recentCompletions}개</span>
      </div>

      {/* 타입별 통계 */}
      <div className="space-y-2 text-xs">
        <div className="text-gray-500 font-medium">타입별 통계</div>
        
        {/* 이벤트 통계 */}
        <div className="flex items-center justify-between bg-blue-50 px-2 py-1 rounded">
          <div className="flex items-center gap-1">
            <span>📅</span>
            <span className="text-gray-700">이벤트</span>
          </div>
          <div className="flex gap-2 text-gray-600">
            <span>전체 {stats.byType.event.total}</span>
            <span>완료 {stats.byType.event.completed}</span>
          </div>
        </div>
        
        {/* 작업 통계 */}
        <div className="flex items-center justify-between bg-green-50 px-2 py-1 rounded">
          <div className="flex items-center gap-1">
            <span>📝</span>
            <span className="text-gray-700">작업</span>
          </div>
          <div className="flex gap-2 text-gray-600">
            <span>전체 {stats.byType.task.total}</span>
            <span>완료 {stats.byType.task.completed}</span>
          </div>
        </div>
      </div>
    </div>
  );
}