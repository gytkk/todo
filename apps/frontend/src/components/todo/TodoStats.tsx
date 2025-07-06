"use client";

import { TodoStats as TodoStatsType } from '@/types';

interface TodoStatsProps {
  stats: TodoStatsType;
}

export function TodoStats({ stats }: TodoStatsProps) {
  if (stats.total === 0) return null;

  return (
    <div className="pt-4 border-t border-gray-100">
      <div className="flex justify-between text-sm text-gray-600">
        <span>전체: {stats.total}개</span>
        <span>완료: {stats.completed}개</span>
        <span>미완료: {stats.incomplete}개</span>
      </div>
    </div>
  );
}