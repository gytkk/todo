"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@calendar-todo/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { MigrationService, MigrationStats } from '@/services/migrationService';
import { AlertCircle, CheckCircle, Database, Upload, Loader2 } from 'lucide-react';

interface MigrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMigrationComplete?: () => void;
}

export function MigrationDialog({ open, onOpenChange, onMigrationComplete }: MigrationDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [migrationStats, setMigrationStats] = useState<MigrationStats | null>(null);
  const [localTodosCount, setLocalTodosCount] = useState(0);
  const [hasLocalData, setHasLocalData] = useState(false);
  const [step, setStep] = useState<'confirm' | 'migrating' | 'complete'>('confirm');

  const migrationService = MigrationService.getInstance();

  const checkLocalData = useCallback(async () => {
    const status = await migrationService.getMigrationStatus();
    setHasLocalData(status.hasLocalData);
    setLocalTodosCount(status.localTodosCount);
  }, [migrationService]);

  useEffect(() => {
    if (open) {
      checkLocalData();
    }
  }, [open, checkLocalData]);

  const handleMigration = async () => {
    setIsLoading(true);
    setStep('migrating');

    try {
      const stats = await migrationService.performFullMigration();
      setMigrationStats(stats);
      setStep('complete');
      
      if (onMigrationComplete) {
        onMigrationComplete();
      }
    } catch (error) {
      console.error('마이그레이션 오류:', error);
      setStep('confirm');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onOpenChange(false);
      setStep('confirm');
      setMigrationStats(null);
    }
  };

  const handleSkip = () => {
    // 로컬 데이터를 유지하고 다이얼로그를 닫습니다
    handleClose();
  };

  const handleNewStart = async () => {
    // 로컬 데이터를 삭제하고 새로 시작합니다
    await migrationService.clearLocalData();
    handleClose();
  };

  if (!hasLocalData) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        {step === 'confirm' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                데이터 마이그레이션
              </DialogTitle>
              <DialogDescription>
                로컬 스토리지에 저장된 할일 데이터를 서버로 이관하시겠습니까?
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 text-blue-800 mb-2">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">발견된 데이터</span>
                </div>
                <p className="text-blue-700">
                  로컬 스토리지에서 <strong>{localTodosCount}개</strong>의 할일을 발견했습니다.
                </p>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <p>• 마이그레이션 후 로컬 데이터는 자동으로 삭제됩니다</p>
                <p>• 마이그레이션 전에 자동으로 백업이 생성됩니다</p>
                <p>• 실패 시 백업에서 복원할 수 있습니다</p>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={handleSkip} disabled={isLoading}>
                나중에
              </Button>
              <Button variant="outline" onClick={handleNewStart} disabled={isLoading}>
                새로 시작
              </Button>
              <Button onClick={handleMigration} disabled={isLoading}>
                <Upload className="h-4 w-4 mr-2" />
                마이그레이션 시작
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'migrating' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                마이그레이션 중...
              </DialogTitle>
              <DialogDescription>
                할일 데이터를 서버로 이관하고 있습니다. 잠시만 기다려주세요.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-6 text-center">
              <div className="animate-pulse">
                <div className="h-2 bg-blue-200 rounded-full mb-4">
                  <div className="h-2 bg-blue-600 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                </div>
                <p className="text-sm text-gray-600">데이터를 처리하는 중...</p>
              </div>
            </div>
          </>
        )}

        {step === 'complete' && migrationStats && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                마이그레이션 완료
              </DialogTitle>
              <DialogDescription>
                할일 데이터 마이그레이션이 완료되었습니다.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>발견된 할일:</span>
                    <span className="font-medium">{migrationStats.totalFound}개</span>
                  </div>
                  <div className="flex justify-between">
                    <span>성공적으로 이관:</span>
                    <span className="font-medium text-green-600">{migrationStats.totalMigrated}개</span>
                  </div>
                  {migrationStats.totalFailed > 0 && (
                    <div className="flex justify-between">
                      <span>실패:</span>
                      <span className="font-medium text-red-600">{migrationStats.totalFailed}개</span>
                    </div>
                  )}
                </div>
              </div>
              
              {migrationStats.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-800 mb-2">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-medium">오류 목록</span>
                  </div>
                  <div className="text-sm text-red-700 max-h-24 overflow-y-auto">
                    {migrationStats.errors.map((error, index) => (
                      <p key={index} className="mb-1">• {error}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button onClick={handleClose}>
                확인
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}