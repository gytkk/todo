import { useEffect, useCallback, useState } from 'react';
import { TodoService } from '@/services/todoService';
import { useAuth } from '@/contexts/AuthContext';

/**
 * 작업 자동 이동을 관리하는 훅
 */
export const useTaskMover = () => {
  const [isMoving, setIsMoving] = useState(false);
  const [lastMoveResult, setLastMoveResult] = useState<{
    message: string;
    movedCount: number;
  } | null>(null);
  
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  /**
   * 작업 이동 실행
   */
  const moveTasks = useCallback(async () => {
    if (!isAuthenticated || isMoving) return;

    setIsMoving(true);
    try {
      const todoService = TodoService.getInstance();
      const result = await todoService.moveTasks();
      
      if (result) {
        setLastMoveResult(result);
        
        // 이동된 작업이 있으면 콘솔에 로그 출력
        if (result.movedCount > 0) {
          console.log(`✅ ${result.message}`);
        }
      }
    } catch (error) {
      console.error('작업 이동 중 오류:', error);
    } finally {
      setIsMoving(false);
    }
  }, [isAuthenticated, isMoving]);

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
    if (!authLoading && isAuthenticated) {
      // 인증이 완료되면 작업 이동 실행
      const timer = setTimeout(() => {
        moveTasks();
      }, 1000); // 1초 후 실행 (다른 초기화 작업들이 완료된 후)

      return () => clearTimeout(timer);
    }
  }, [authLoading, isAuthenticated, moveTasks]);

  return {
    moveTasks,
    getTasksDue,
    isMoving,
    lastMoveResult,
  };
};