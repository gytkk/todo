import { useState, useEffect, useCallback } from 'react';
import { MigrationService, MigrationStats } from '@/services/migrationService';

export const useMigration = () => {
  const [hasLocalData, setHasLocalData] = useState(false);
  const [hasBackup, setHasBackup] = useState(false);
  const [localTodosCount, setLocalTodosCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const migrationService = MigrationService.getInstance();

  const checkMigrationStatus = useCallback(async () => {
    try {
      const status = await migrationService.getMigrationStatus();
      setHasLocalData(status.hasLocalData);
      setHasBackup(status.hasBackup);
      setLocalTodosCount(status.localTodosCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : '마이그레이션 상태 확인 중 오류가 발생했습니다');
    }
  }, [migrationService]);

  const performMigration = useCallback(async (): Promise<MigrationStats | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const stats = await migrationService.performFullMigration();
      await checkMigrationStatus(); // 상태 업데이트
      return stats;
    } catch (err) {
      setError(err instanceof Error ? err.message : '마이그레이션 중 오류가 발생했습니다');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [migrationService, checkMigrationStatus]);

  const clearLocalData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await migrationService.clearLocalData();
      await checkMigrationStatus(); // 상태 업데이트
    } catch (err) {
      setError(err instanceof Error ? err.message : '로컬 데이터 삭제 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  }, [migrationService, checkMigrationStatus]);

  const restoreFromBackup = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const success = await migrationService.restoreFromBackup();
      if (success) {
        await checkMigrationStatus(); // 상태 업데이트
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : '백업 복원 중 오류가 발생했습니다');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [migrationService, checkMigrationStatus]);

  const clearBackup = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await migrationService.clearBackup();
      await checkMigrationStatus(); // 상태 업데이트
    } catch (err) {
      setError(err instanceof Error ? err.message : '백업 삭제 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  }, [migrationService, checkMigrationStatus]);

  // 컴포넌트 마운트 시 상태 확인
  useEffect(() => {
    checkMigrationStatus();
  }, [checkMigrationStatus]);

  return {
    hasLocalData,
    hasBackup,
    localTodosCount,
    isLoading,
    error,
    performMigration,
    clearLocalData,
    restoreFromBackup,
    clearBackup,
    checkMigrationStatus,
  };
};