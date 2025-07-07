"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Calendar, CheckCircle, Clock, TrendingUp, Target } from "lucide-react";
import { TodoItem } from '@/types';
import { useMemo } from 'react';
import { format, subDays, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { ko } from 'date-fns/locale';

interface StatisticsPageProps {
  todos: TodoItem[];
}

export function StatisticsPage({ todos }: StatisticsPageProps) {
  // 기본 통계 계산
  const basicStats = useMemo(() => {
    const completedTodos = todos.filter(t => t.completed).length;
    const total = todos.length;
    const incomplete = total - completedTodos;
    const completionRate = total > 0 ? Math.round((completedTodos / total) * 100) : 0;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentCompletions = todos.filter(
      t => t.completed && new Date(t.date) >= sevenDaysAgo
    ).length;

    return {
      total,
      completed: completedTodos,
      incomplete,
      completionRate,
      recentCompletions,
    };
  }, [todos]);

  // 주간 통계 계산
  const weeklyStats = useMemo(() => {
    const today = new Date();
    const thisWeekStart = startOfWeek(today, { locale: ko });
    const thisWeekEnd = endOfWeek(today, { locale: ko });
    const lastWeekStart = subDays(thisWeekStart, 7);
    const lastWeekEnd = subDays(thisWeekEnd, 7);

    const thisWeekTodos = todos.filter(todo => 
      isWithinInterval(todo.date, { start: thisWeekStart, end: thisWeekEnd })
    );
    const lastWeekTodos = todos.filter(todo => 
      isWithinInterval(todo.date, { start: lastWeekStart, end: lastWeekEnd })
    );

    const thisWeekCompleted = thisWeekTodos.filter(t => t.completed).length;
    const lastWeekCompleted = lastWeekTodos.filter(t => t.completed).length;

    return {
      thisWeek: {
        total: thisWeekTodos.length,
        completed: thisWeekCompleted,
        completionRate: thisWeekTodos.length > 0 ? Math.round((thisWeekCompleted / thisWeekTodos.length) * 100) : 0
      },
      lastWeek: {
        total: lastWeekTodos.length,
        completed: lastWeekCompleted,
        completionRate: lastWeekTodos.length > 0 ? Math.round((lastWeekCompleted / lastWeekTodos.length) * 100) : 0
      }
    };
  }, [todos]);

  // 일별 완료 데이터 (최근 7일)
  const dailyCompletions = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayTodos = todos.filter(todo => 
        format(todo.date, 'yyyy-MM-dd') === dateStr
      );
      const completed = dayTodos.filter(t => t.completed).length;
      
      return {
        date: dateStr,
        day: format(date, 'EEE', { locale: ko }),
        total: dayTodos.length,
        completed,
        completionRate: dayTodos.length > 0 ? Math.round((completed / dayTodos.length) * 100) : 0
      };
    });
    
    return last7Days;
  }, [todos]);

  // 월별 통계
  const monthlyTrend = useMemo(() => {
    const currentMonth = new Date();
    const lastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    
    const currentMonthStr = format(currentMonth, 'yyyy-MM');
    const lastMonthStr = format(lastMonth, 'yyyy-MM');
    
    const currentMonthTodos = todos.filter(todo => 
      format(todo.date, 'yyyy-MM') === currentMonthStr
    );
    const lastMonthTodos = todos.filter(todo => 
      format(todo.date, 'yyyy-MM') === lastMonthStr
    );

    const currentCompleted = currentMonthTodos.filter(t => t.completed).length;
    const lastCompleted = lastMonthTodos.filter(t => t.completed).length;

    return {
      current: {
        month: format(currentMonth, 'MMMM', { locale: ko }),
        total: currentMonthTodos.length,
        completed: currentCompleted,
        completionRate: currentMonthTodos.length > 0 ? Math.round((currentCompleted / currentMonthTodos.length) * 100) : 0
      },
      last: {
        month: format(lastMonth, 'MMMM', { locale: ko }),
        total: lastMonthTodos.length,
        completed: lastCompleted,
        completionRate: lastMonthTodos.length > 0 ? Math.round((lastCompleted / lastMonthTodos.length) * 100) : 0
      }
    };
  }, [todos]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">통계</h1>
          <p className="text-gray-600 mt-2">할일 완료 현황과 통계를 확인하세요</p>
        </div>
      </div>

      {/* 기본 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">전체 할일</p>
                <p className="text-2xl font-bold text-gray-900">{basicStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">완료된 할일</p>
                <p className="text-2xl font-bold text-green-600">{basicStats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">진행 중</p>
                <p className="text-2xl font-bold text-orange-600">{basicStats.incomplete}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">완료율</p>
                <p className="text-2xl font-bold text-purple-600">{basicStats.completionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 주간 비교 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            주간 성과 비교
          </CardTitle>
          <CardDescription>
            이번 주와 지난 주의 할일 완료 현황을 비교합니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">이번 주</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">전체 할일</span>
                  <span className="font-medium">{weeklyStats.thisWeek.total}개</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">완료된 할일</span>
                  <span className="font-medium text-green-600">{weeklyStats.thisWeek.completed}개</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">완료율</span>
                  <Badge variant="outline">{weeklyStats.thisWeek.completionRate}%</Badge>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium">지난 주</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">전체 할일</span>
                  <span className="font-medium">{weeklyStats.lastWeek.total}개</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">완료된 할일</span>
                  <span className="font-medium text-green-600">{weeklyStats.lastWeek.completed}개</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">완료율</span>
                  <Badge variant="outline">{weeklyStats.lastWeek.completionRate}%</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 일별 완료 현황 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            최근 7일 완료 현황
          </CardTitle>
          <CardDescription>
            일별 할일 완료 추이를 확인하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dailyCompletions.map((day) => (
              <div key={day.date} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="text-sm font-medium w-8">{day.day}</div>
                  <div className="text-sm text-gray-600">{format(new Date(day.date), 'MM/dd')}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm">
                    <span className="text-green-600 font-medium">{day.completed}</span>
                    <span className="text-gray-500">/{day.total}</span>
                  </div>
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${day.completionRate}%` }}
                    />
                  </div>
                  <Badge variant="outline" className="w-12 text-center">
                    {day.completionRate}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 월별 트렌드 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            월별 트렌드
          </CardTitle>
          <CardDescription>
            이번 달과 지난 달의 성과를 비교합니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">{monthlyTrend.current.month}</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">전체 할일</span>
                  <span className="font-medium">{monthlyTrend.current.total}개</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">완료된 할일</span>
                  <span className="font-medium text-green-600">{monthlyTrend.current.completed}개</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">완료율</span>
                  <Badge variant="outline">{monthlyTrend.current.completionRate}%</Badge>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium">{monthlyTrend.last.month}</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">전체 할일</span>
                  <span className="font-medium">{monthlyTrend.last.total}개</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">완료된 할일</span>
                  <span className="font-medium text-green-600">{monthlyTrend.last.completed}개</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">완료율</span>
                  <Badge variant="outline">{monthlyTrend.last.completionRate}%</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 최근 활동 */}
      <Card>
        <CardHeader>
          <CardTitle>최근 활동</CardTitle>
          <CardDescription>
            최근 7일간의 활동 요약입니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge variant="outline">최근 7일</Badge>
            <span className="text-sm text-gray-600">
              {basicStats.recentCompletions}개 할일 완료
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}