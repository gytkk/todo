import { useEffect, useCallback, useState } from 'react';
import { TodoService } from '@/services/todoService';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/hooks/useSettings';
import { useToast } from '@/contexts/ToastContext';

/**
 * 작업 자동 이동을 관리하는 훅
 */
export const useTaskMover = () => {
  const [isMoving, setIsMoving] = useState(false);
  const [lastMoveResult, setLastMoveResult] = useState<{
    message: string;
    movedCount: number;
    movedTaskIds: string[];
  } | null>(null);
  const [recentlyMovedTaskIds, setRecentlyMovedTaskIds] = useState<string[]>([]);
  
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { settings } = useSettings();
  const { showSuccess, showError, showInfo } = useToast();

  /**
   * 작업 이동 실행
   */
  const moveTasks = useCallback(async () => {
    if (!isAuthenticated || isMoving || !settings.autoMoveTodos) return;

    setIsMoving(true);
    try {
      const todoService = TodoService.getInstance();
      const result = await todoService.moveTasks();
      
      if (result) {
        setLastMoveResult(result);
        
        // 이동된 작업 ID들을 최근 이동 목록에 추가
        if (result.movedCount > 0) {
          setRecentlyMovedTaskIds(result.movedTaskIds);
          
          // 5초 후 하이라이트 제거
          setTimeout(() => {
            setRecentlyMovedTaskIds([]);
          }, 5000);
          
          if (settings.showTaskMoveNotifications) {
            showSuccess(
              '작업 자동 이동 완료',
              `${result.movedCount}개의 미완료 작업이 오늘 날짜로 이동되었습니다.`
            );
          }
        } else if (result.movedCount === 0 && settings.showTaskMoveNotifications) {
          showInfo(
            '작업 이동 없음',
            '이동할 미완료 작업이 없습니다.'
          );
        }
      }
    } catch (error) {
      console.error('작업 이동 중 오류:', error);
      if (settings.showTaskMoveNotifications) {
        showError(
          '작업 이동 실패',
          '작업 이동 중 오류가 발생했습니다. 다시 시도해주세요.'
        );
      }
    } finally {
      setIsMoving(false);
    }
  }, [isAuthenticated, isMoving, settings.autoMoveTodos, settings.showTaskMoveNotifications, showSuccess, showError, showInfo]);

  /**
   * 이동 대상 작업들 조회
   */
  const getTasksDue = useCallback(async () => {
    if (!isAuthenticated) return null;

    try {
      const todoService = TodoService.getInstance();
      return await todoService.getTasksDue();
    } catch (error) {
      console.error('이동 대상 작업 조회 중 오류:', error);
      return null;
    }
  }, [isAuthenticated]);

  // 앱 로드 시 자동으로 작업 이동 실행
  useEffect(() => {
    if (!authLoading && isAuthenticated && settings.autoMoveTodos) {
      // 인증이 완료되고 자동 이동이 활성화된 경우 작업 이동 실행
      const timer = setTimeout(() => {
        moveTasks();
      }, 1000); // 1초 후 실행 (다른 초기화 작업들이 완료된 후)

      return () => clearTimeout(timer);
    }
  }, [authLoading, isAuthenticated, settings.autoMoveTodos, moveTasks]);

  return {
    moveTasks,
    getTasksDue,
    isMoving,
    lastMoveResult,
    recentlyMovedTaskIds,
  };
};