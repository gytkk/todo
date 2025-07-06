"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trash2, Download, Upload, Palette, Calendar, Settings as SettingsIcon, Copy, Code, Edit3, Eye, Check, AlertTriangle, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { TodoItem, AppSettings } from '@/types';
import { useSettings } from '@/hooks/useSettings';
import { useTodos } from '@/hooks/useTodos';

interface SettingsProps {
  todos: TodoItem[];
  onClearData: () => void;
}

export function Settings({ todos, onClearData }: SettingsProps) {
  const [isClearing, setIsClearing] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [showJsonEditor, setShowJsonEditor] = useState(false);

  // JSON 편집기 상태
  const [jsonText, setJsonText] = useState<string>('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [settingsBackup, setSettingsBackup] = useState<AppSettings | null>(null);
  
  const { settings, updateSetting, resetSettings, setSettings } = useSettings();

  // settings 변경 시 jsonText 동기화
  useEffect(() => {
    if (!isEditing) {
      setJsonText(JSON.stringify(settings, null, 2));
    }
  }, [settings, isEditing]);

  // JSON 편집기 시작
  const startJsonEditing = () => {
    setSettingsBackup(settings); // 백업 저장
    setJsonText(JSON.stringify(settings, null, 2));
    setIsEditing(true);
    setJsonError(null);
  };

  // JSON 편집기 종료
  const stopJsonEditing = () => {
    setIsEditing(false);
    setJsonError(null);
    setSettingsBackup(null);
  };

  // JSON 유효성 검증 및 설정 적용
  const validateAndApplySettings = (jsonData: unknown): boolean => {
    try {
      // 기본 타입 검증
      if (typeof jsonData !== 'object' || jsonData === null) {
        throw new Error('설정은 객체 형태여야 합니다.');
      }

      // 필수 필드 검증
      const data = jsonData as Record<string, unknown>;
      const requiredFields: (keyof AppSettings)[] = [
        'theme', 'language', 'dateFormat', 'timeFormat',
        'weekStart', 'defaultView', 'showWeekends', 'autoBackup', 'backupInterval'
      ];

      for (const field of requiredFields) {
        if (!(field in data)) {
          throw new Error(`필수 필드 '${field}'가 누락되었습니다.`);
        }
      }

      // 값 범위 검증
      const validThemes = ['light', 'dark', 'system'];
      const validLanguages = ['ko', 'en'];
      const validDateFormats = ['YYYY-MM-DD', 'MM/DD/YYYY', 'DD/MM/YYYY'];
      const validTimeFormats = ['12h', '24h'];
      const validWeekStarts = ['sunday', 'monday', 'saturday'];
      const validDefaultViews = ['month', 'week', 'day'];
      const validBackupIntervals = ['daily', 'weekly', 'monthly'];

      if (!validThemes.includes(data.theme as string)) {
        throw new Error(`theme은 ${validThemes.join(', ')} 중 하나여야 합니다.`);
      }
      if (!validLanguages.includes(data.language as string)) {
        throw new Error(`language는 ${validLanguages.join(', ')} 중 하나여야 합니다.`);
      }
      if (!validDateFormats.includes(data.dateFormat as string)) {
        throw new Error(`dateFormat은 ${validDateFormats.join(', ')} 중 하나여야 합니다.`);
      }
      if (!validTimeFormats.includes(data.timeFormat as string)) {
        throw new Error(`timeFormat은 ${validTimeFormats.join(', ')} 중 하나여야 합니다.`);
      }
      if (!validWeekStarts.includes(data.weekStart as string)) {
        throw new Error(`weekStart는 ${validWeekStarts.join(', ')} 중 하나여야 합니다.`);
      }
      if (!validDefaultViews.includes(data.defaultView as string)) {
        throw new Error(`defaultView는 ${validDefaultViews.join(', ')} 중 하나여야 합니다.`);
      }
      if (!validBackupIntervals.includes(data.backupInterval as string)) {
        throw new Error(`backupInterval은 ${validBackupIntervals.join(', ')} 중 하나여야 합니다.`);
      }

      // boolean 타입 검증
      if (typeof data.showWeekends !== 'boolean') {
        throw new Error('showWeekends는 true 또는 false여야 합니다.');
      }
      if (typeof data.autoBackup !== 'boolean') {
        throw new Error('autoBackup은 true 또는 false여야 합니다.');
      }

      // 검증 통과 시 설정 적용
      setSettings(jsonData as AppSettings);
      return true;
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
      return false;
    }
  };

  // JSON 텍스트 변경 처리
  const handleJsonChange = (newJsonText: string) => {
    setJsonText(newJsonText);

    if (newJsonText.trim() === '') {
      setJsonError('JSON이 비어있습니다.');
      return;
    }

    try {
      const parsed = JSON.parse(newJsonText);
      validateAndApplySettings(parsed);
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : 'JSON 구문 오류');
    }
  };

  // JSON 포맷팅
  const formatJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setJsonText(JSON.stringify(parsed, null, 2));
      setJsonError(null);
    } catch {
      setJsonError('유효하지 않은 JSON입니다. 포맷팅할 수 없습니다.');
    }
  };

  // 백업에서 복원
  const restoreFromBackup = () => {
    if (settingsBackup) {
      setSettings(settingsBackup);
      setJsonText(JSON.stringify(settingsBackup, null, 2));
      setJsonError(null);
    }
  };


  // JSON 복사 기능
  const handleCopyJson = async () => {
    try {
      const jsonString = JSON.stringify(settings, null, 2);
      await navigator.clipboard.writeText(jsonString);
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    } catch (err) {
      console.error('Failed to copy JSON:', err);
    }
  };

  const handleClearData = async (): Promise<void> => {
    setIsClearing(true);
    await new Promise<void>(resolve => setTimeout(resolve, 1000)); // 애니메이션 효과
    onClearData();
    setIsClearing(false);
  };

  const handleExportData = (): void => {
    const dataStr = JSON.stringify(todos, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = `todo-calendar-backup-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>): void => {
        try {
          const importedData: TodoItem[] = JSON.parse(e.target?.result as string);
          // 데이터 검증 후 localStorage에 저장
          localStorage.setItem("calendar-todos", JSON.stringify(importedData));
          window.location.reload(); // 페이지 새로고침으로 데이터 반영
        } catch (error: unknown) {
          console.error('Import error:', error);
          alert('파일 형식이 올바르지 않습니다.');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">설정</h1>
          <p className="text-gray-600 mt-2">앱 설정을 관리하세요</p>
        </div>

        {/* JSON 편집기 토글 버튼 */}
        <Button
          variant={showJsonEditor ? "default" : "outline"}
          onClick={() => setShowJsonEditor(!showJsonEditor)}
          className="flex items-center gap-2"
        >
          <Code className="h-4 w-4" />
          {showJsonEditor ? "일반 모드" : "JSON 편집기"}
        </Button>
      </div>

      {showJsonEditor ? (
        /* JSON 편집기 전체 화면 모드 */
        <div className="w-full">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  설정 JSON 편집기
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowJsonEditor(false)}
                  className="flex items-center gap-2"
                >
                  ✕ 닫기
                </Button>
              </CardTitle>
              <CardDescription>
                현재 설정을 JSON 형식으로 보고 관리하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* JSON 미리보기 및 편집 영역 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 왼쪽: JSON 편집기 */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      JSON 편집기
                      {isEditing && (
                        <Badge variant="outline" className="text-xs">
                          <Edit3 className="h-3 w-3 mr-1" />
                          편집 중
                        </Badge>
                      )}
                      {jsonError && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          오류
                        </Badge>
                      )}
                      {!jsonError && !isEditing && (
                        <Badge variant="outline" className="text-xs text-green-600">
                          <Check className="h-3 w-3 mr-1" />
                          정상
                        </Badge>
                      )}
                    </h3>
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={formatJson}
                            disabled={!!jsonError}
                            className="flex items-center gap-1"
                          >
                            <RefreshCw className="h-3 w-3" />
                            포맷
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={restoreFromBackup}
                            disabled={!settingsBackup}
                            className="flex items-center gap-1"
                          >
                            <RefreshCw className="h-3 w-3" />
                            복원
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={stopJsonEditing}
                            className="flex items-center gap-1"
                          >
                            <Eye className="h-3 w-3" />
                            읽기
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopyJson}
                            disabled={copiedJson}
                            className="flex items-center gap-1"
                          >
                            <Copy className="h-3 w-3" />
                            {copiedJson ? '복사됨' : '복사'}
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={startJsonEditing}
                            className="flex items-center gap-1"
                          >
                            <Edit3 className="h-3 w-3" />
                            편집
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* JSON 편집기/뷰어 */}
                  <div className="relative">
                    {isEditing ? (
                      <textarea
                        value={jsonText}
                        onChange={(e) => handleJsonChange(e.target.value)}
                        className={`w-full h-96 p-4 rounded-lg text-sm font-mono border resize-none focus:outline-none focus:ring-2 focus:ring-offset-2 ${jsonError
                            ? 'border-red-500 focus:ring-red-500 bg-red-50'
                            : 'border-gray-300 focus:ring-blue-500 bg-white'
                          }`}
                        placeholder="JSON 설정을 입력하세요..."
                        spellCheck={false}
                      />
                    ) : (
                      <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-auto h-96 border font-mono">
                        <code className="text-gray-800">
                          {jsonText || JSON.stringify(settings, null, 2)}
                        </code>
                      </pre>
                    )}
                  </div>

                  {/* 오류 메시지 */}
                  {jsonError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-red-800">JSON 오류</p>
                          <p className="text-sm text-red-600 mt-1">{jsonError}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 편집 도움말 */}
                  {isEditing && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <Code className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-blue-800">편집 팁</p>
                          <ul className="text-sm text-blue-600 mt-1 space-y-1">
                            <li>• JSON 형식을 정확히 지켜주세요 (쌍따옴표, 쉼표 등)</li>
                            <li>• 변경사항은 실시간으로 적용됩니다</li>
                            <li>• &ldquo;포맷&rdquo; 버튼으로 들여쓰기를 정리할 수 있습니다</li>
                            <li>• 오류 발생 시 &ldquo;복원&rdquo; 버튼으로 이전 상태로 돌아갈 수 있습니다</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 오른쪽: 설정 설명 및 관리 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">설정 관리</h3>

                  {/* JSON 필드 설명 */}
                  <div className="space-y-3">
                    <h4 className="text-base font-medium">JSON 필드 설명</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="grid grid-cols-1 gap-2">
                        <p><code className="bg-gray-100 px-2 py-1 rounded text-xs">theme</code>: 테마 설정 (light/dark/system)</p>
                        <p><code className="bg-gray-100 px-2 py-1 rounded text-xs">language</code>: 언어 설정 (ko/en)</p>
                        <p><code className="bg-gray-100 px-2 py-1 rounded text-xs">dateFormat</code>: 날짜 형식</p>
                        <p><code className="bg-gray-100 px-2 py-1 rounded text-xs">timeFormat</code>: 시간 형식 (12h/24h)</p>
                        <p><code className="bg-gray-100 px-2 py-1 rounded text-xs">weekStart</code>: 주 시작일</p>
                        <p><code className="bg-gray-100 px-2 py-1 rounded text-xs">defaultView</code>: 기본 뷰 (month/week/day)</p>
                        <p><code className="bg-gray-100 px-2 py-1 rounded text-xs">showWeekends</code>: 주말 표시 (true/false)</p>
                        <p><code className="bg-gray-100 px-2 py-1 rounded text-xs">autoBackup</code>: 자동 백업 (true/false)</p>
                        <p><code className="bg-gray-100 px-2 py-1 rounded text-xs">backupInterval</code>: 백업 주기</p>
                      </div>
                    </div>
                  </div>

                  {/* 현재 설정 요약 */}
                  <div className="space-y-3">
                    <h4 className="text-base font-medium">현재 설정 요약</h4>
                    <div className="bg-blue-50 p-4 rounded-lg space-y-2 text-sm">
                      <p><strong>테마:</strong> {settings.theme === 'light' ? '라이트 모드' : settings.theme === 'dark' ? '다크 모드' : '시스템 설정'}</p>
                      <p><strong>언어:</strong> {settings.language === 'ko' ? '한국어' : '영어'}</p>
                      <p><strong>날짜 형식:</strong> {settings.dateFormat}</p>
                      <p><strong>시간 형식:</strong> {settings.timeFormat === '24h' ? '24시간' : '12시간'}</p>
                      <p><strong>주 시작일:</strong> {settings.weekStart === 'sunday' ? '일요일' : settings.weekStart === 'monday' ? '월요일' : '토요일'}</p>
                      <p><strong>기본 뷰:</strong> {settings.defaultView === 'month' ? '월 보기' : settings.defaultView === 'week' ? '주 보기' : '일 보기'}</p>
                      <p><strong>주말 표시:</strong> {settings.showWeekends ? '표시' : '숨김'}</p>
                      <p><strong>자동 백업:</strong> {settings.autoBackup ? `활성화 (${settings.backupInterval})` : '비활성화'}</p>
                    </div>
                  </div>

                  {/* 액션 버튼들 */}
                  <div className="space-y-3">
                    <h4 className="text-base font-medium">작업</h4>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          const dataStr = JSON.stringify(settings, null, 2);
                          const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
                          const exportFileDefaultName = `settings-${new Date().toISOString().split('T')[0]}.json`;
                          const linkElement = document.createElement('a');
                          linkElement.setAttribute('href', dataUri);
                          linkElement.setAttribute('download', exportFileDefaultName);
                          linkElement.click();
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        설정 JSON 다운로드
                      </Button>

                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          if (confirm('설정을 기본값으로 초기화하시겠습니까?')) {
                            resetSettings();
                          }
                        }}
                      >
                        <SettingsIcon className="h-4 w-4 mr-2" />
                        기본값으로 초기화
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* 일반 설정 모드 */
        <div className="space-y-6">

          {/* 애플리케이션 설정 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                애플리케이션 설정
              </CardTitle>
              <CardDescription>
                테마, 언어 및 기본 설정을 관리합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 테마 설정 */}
              <div className="space-y-3">
                <Label htmlFor="theme-select" className="text-sm font-medium">테마</Label>
                <Select value={settings.theme} onValueChange={(value) => updateSetting('theme', value as AppSettings['theme'])}>
                  <SelectTrigger id="theme-select">
                    <SelectValue placeholder="테마를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">라이트 모드</SelectItem>
                    <SelectItem value="dark">다크 모드</SelectItem>
                    <SelectItem value="system">시스템 설정</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 언어 설정 */}
              <div className="space-y-3">
                <Label htmlFor="language-select" className="text-sm font-medium">언어</Label>
                <Select value={settings.language} onValueChange={(value) => updateSetting('language', value as AppSettings['language'])}>
                  <SelectTrigger id="language-select">
                    <SelectValue placeholder="언어를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ko">한국어</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 날짜 형식 */}
              <div className="space-y-3">
                <Label htmlFor="date-format-select" className="text-sm font-medium">날짜 형식</Label>
                <Select value={settings.dateFormat} onValueChange={(value) => updateSetting('dateFormat', value as AppSettings['dateFormat'])}>
                  <SelectTrigger id="date-format-select">
                    <SelectValue placeholder="날짜 형식을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="YYYY-MM-DD">2024-01-15</SelectItem>
                    <SelectItem value="MM/DD/YYYY">01/15/2024</SelectItem>
                    <SelectItem value="DD/MM/YYYY">15/01/2024</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 시간 형식 */}
              <div className="space-y-3">
                <Label htmlFor="time-format-select" className="text-sm font-medium">시간 형식</Label>
                <Select value={settings.timeFormat} onValueChange={(value) => updateSetting('timeFormat', value as AppSettings['timeFormat'])}>
                  <SelectTrigger id="time-format-select">
                    <SelectValue placeholder="시간 형식을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12h">12시간 (오전/오후)</SelectItem>
                    <SelectItem value="24h">24시간</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 주 시작일 */}
              <div className="space-y-3">
                <Label htmlFor="week-start-select" className="text-sm font-medium">주 시작일</Label>
                <Select value={settings.weekStart} onValueChange={(value) => updateSetting('weekStart', value as AppSettings['weekStart'])}>
                  <SelectTrigger id="week-start-select">
                    <SelectValue placeholder="주 시작일을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sunday">일요일</SelectItem>
                    <SelectItem value="monday">월요일</SelectItem>
                    <SelectItem value="saturday">토요일</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* 캘린더 설정 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                캘린더 설정
              </CardTitle>
              <CardDescription>
                캘린더 표시 및 뷰 설정을 관리합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 기본 뷰 */}
              <div className="space-y-3">
                <Label htmlFor="default-view-select" className="text-sm font-medium">기본 뷰</Label>
                <Select value={settings.defaultView} onValueChange={(value) => updateSetting('defaultView', value as AppSettings['defaultView'])}>
                  <SelectTrigger id="default-view-select">
                    <SelectValue placeholder="기본 뷰를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">월 보기</SelectItem>
                    <SelectItem value="week">주 보기</SelectItem>
                    <SelectItem value="day">일 보기</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 주말 표시 */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">주말 표시</Label>
                  <p className="text-sm text-gray-600">캘린더에서 주말을 표시합니다</p>
                </div>
                <Switch
                  checked={settings.showWeekends}
                  onCheckedChange={(checked) => updateSetting('showWeekends', checked)}
                />
              </div>
            </CardContent>
          </Card>


          {/* 데이터 관리 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                데이터 관리
              </CardTitle>
              <CardDescription>
                할일 데이터를 백업하거나 초기화할 수 있습니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 자동 백업 설정 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">자동 백업</Label>
                    <p className="text-sm text-gray-600">정기적으로 데이터를 자동 백업합니다</p>
                  </div>
                  <Switch
                    checked={settings.autoBackup}
                    onCheckedChange={(checked) => updateSetting('autoBackup', checked)}
                  />
                </div>

                {settings.autoBackup && (
                  <div className="space-y-3">
                    <Label htmlFor="backup-interval-select" className="text-sm font-medium">백업 주기</Label>
                    <Select value={settings.backupInterval} onValueChange={(value) => updateSetting('backupInterval', value as AppSettings['backupInterval'])}>
                      <SelectTrigger id="backup-interval-select">
                        <SelectValue placeholder="백업 주기를 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">매일</SelectItem>
                        <SelectItem value="weekly">매주</SelectItem>
                        <SelectItem value="monthly">매월</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* 데이터 백업/복원 */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleExportData}
                  className="flex-1"
                  disabled={todos.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  데이터 내보내기
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={(): void => {
                    const element = document.getElementById('import-file') as HTMLInputElement;
                    element?.click();
                  }}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  데이터 가져오기
                </Button>
                <input
                  id="import-file"
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="hidden"
                />
              </div>

              {/* 데이터 초기화 */}
              <div className="pt-4 border-t">
                <Button
                  variant="destructive"
                  onClick={handleClearData}
                  disabled={isClearing || todos.length === 0}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isClearing ? '데이터 삭제 중...' : '모든 데이터 삭제'}
                </Button>
                <p className="text-xs text-gray-500 text-center mt-2">
                  이 작업은 되돌릴 수 없습니다. 신중하게 결정하세요.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 앱 정보 */}
          <Card>
            <CardHeader>
              <CardTitle>앱 정보</CardTitle>
              <CardDescription>
                TODO Calendar 앱에 대한 정보입니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">버전</Label>
                  <p className="text-sm text-gray-600">1.0.0</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">빌드 날짜</Label>
                  <p className="text-sm text-gray-600">{new Date().toLocaleDateString('ko-KR')}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">개발자</Label>
                <p className="text-sm text-gray-600">TODO Calendar Team</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
