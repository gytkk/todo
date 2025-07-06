"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Palette, Calendar, Code, Eye, Check, AlertTriangle, RefreshCw, User, Plus, 
  Minus, LogOut, RotateCcw, UserX, Lock, Camera, Star, Info
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { TodoItem, AppSettings } from '@/types';
import { useSettings } from '@/hooks/useSettings';

interface SettingsProps {
  todos: TodoItem[];
  onClearData: () => void;
}

export function Settings({ onClearData }: SettingsProps) {
  const [showJsonEditor, setShowJsonEditor] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3B82F6');
  const [activeSection, setActiveSection] = useState('user-info');
  const [mounted, setMounted] = useState(false);

  // 섹션 정보 정의
  const sections = useMemo(() => [
    { id: 'user-info', title: '사용자 정보', icon: User },
    { id: 'category-management', title: '카테고리 관리', icon: Palette },
    { id: 'display-settings', title: '보기 설정', icon: Eye },
    { id: 'calendar-settings', title: '캘린더 설정', icon: Calendar },
    { id: 'todo-settings', title: '할 일 설정', icon: Check },
    { id: 'reset-settings', title: '설정 초기화', icon: RefreshCw },
    { id: 'service-info', title: '서비스 정보', icon: Info },
  ], []);

  const { 
    settings, 
    updateSetting, 
    resetSettings,
    addCategory,
    removeCategory,
    updateCategory,
    setDefaultCategory
  } = useSettings();

  // Hydration 완료 후 mounted 상태 설정
  useEffect(() => {
    setMounted(true);
  }, []);

  // 섹션으로 스크롤하는 함수
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(sectionId);
    }
  };

  // 스크롤 감지를 통한 활성 섹션 업데이트
  useEffect(() => {
    const handleScroll = () => {
      const sectionElements = sections.map(section => ({
        id: section.id,
        element: document.getElementById(section.id),
      })).filter(item => item.element);

      const currentSection = sectionElements.find(({ element }) => {
        if (!element) return false;
        const rect = element.getBoundingClientRect();
        return rect.top <= 100 && rect.bottom >= 100;
      });

      if (currentSection) {
        setActiveSection(currentSection.id);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections]);

  const handleClearData = async (): Promise<void> => {
    await new Promise<void>(resolve => setTimeout(resolve, 1000));
    onClearData();
  };

  const handlePasswordChange = () => {
    if (newPassword !== confirmPassword) {
      alert('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    if (newPassword.length < 6) {
      alert('비밀번호는 6자리 이상이어야 합니다.');
      return;
    }
    alert('비밀번호가 변경되었습니다.');
    setShowPasswordModal(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      alert('카테고리 이름을 입력하세요.');
      return;
    }
    const currentCategories = settings.categories || [];
    if (currentCategories.length >= 10) {
      alert('카테고리는 최대 10개까지 추가할 수 있습니다.');
      return;
    }
    addCategory(newCategoryName.trim(), newCategoryColor);
    setNewCategoryName('');
    setNewCategoryColor('#3B82F6');
  };

  const handleRemoveCategory = (id: string) => {
    const currentCategories = settings.categories || [];
    if (currentCategories.length <= 1) {
      alert('카테고리는 최소 하나 이상 존재해야 합니다.');
      return;
    }
    if (confirm('이 카테고리를 삭제하시겠습니까?')) {
      removeCategory(id);
    }
  };

  const handleLogout = () => {
    if (confirm('로그아웃하시겠습니까?')) {
      alert('로그아웃되었습니다.');
    }
  };

  const handleDeleteAccount = () => {
    const password = prompt('계정을 삭제하려면 비밀번호를 입력하세요:');
    if (password) {
      if (confirm('정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
        alert('계정이 삭제되었습니다.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">설정</h1>
            <p className="text-gray-600 mt-2">앱 설정을 관리하세요</p>
          </div>

          <Button
            variant={showJsonEditor ? "default" : "outline"}
            onClick={() => setShowJsonEditor(!showJsonEditor)}
            className="flex items-center gap-2"
          >
            <Code className="h-4 w-4" />
            {showJsonEditor ? "일반 모드" : "JSON 편집기"}
          </Button>
        </div>
      </div>

      {/* 메인 컨텐츠 영역 */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-4 gap-8">
            {/* 왼쪽 네비게이션 컬럼 */}
            <div className="col-span-1">
              <div className="sticky top-24">
                <nav className="space-y-2">
                  {sections.map((section) => {
                    const IconComponent = section.icon;
                    return (
                      <button
                        key={section.id}
                        onClick={() => scrollToSection(section.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                          activeSection === section.id
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <IconComponent className="h-5 w-5" />
                        <span className="text-sm font-medium">{section.title}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* 오른쪽 컨텐츠 컬럼 */}
            <div className="col-span-3">
              <div className="space-y-8">

            {showJsonEditor ? (
              <div id="json-editor" className="w-full">
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
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="text-sm overflow-auto scrollbar-visible max-h-96">
                  <code>{JSON.stringify(settings, null, 2)}</code>
                </pre>
              </div>
            </CardContent>
              </Card>
            </div>
            ) : (
              <>
                {/* 사용자 정보 섹션 */}
                <Card id="user-info">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                사용자 정보
              </CardTitle>
              <CardDescription>
                사용자 정보를 관리하고 계정 설정을 변경합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">사용자 이름</Label>
                    <p className="text-base text-gray-900 px-3 py-2 min-h-[40px] flex items-center bg-gray-50 rounded-md border">
                      {settings.userInfo?.name || '사용자'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">이메일 주소</Label>
                    <p className="text-base text-gray-900 px-3 py-2 min-h-[40px] flex items-center bg-gray-50 rounded-md border">
                      {settings.userInfo?.email || 'user@example.com'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-center space-y-4">
                  <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                    {settings.userInfo?.profileImage ? (
                      <Image
                        src={settings.userInfo.profileImage}
                        alt="프로필 사진"
                        width={96}
                        height={96}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-12 w-12 text-gray-400" />
                    )}
                  </div>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    사진 변경
                  </Button>
                </div>
              </div>

              <div className="border-t pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        비밀번호 변경
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>비밀번호 변경</DialogTitle>
                        <DialogDescription>새로운 비밀번호를 입력하세요</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="current-password">현재 비밀번호</Label>
                          <Input
                            id="current-password"
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="new-password">새 비밀번호</Label>
                          <Input
                            id="new-password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirm-password">비밀번호 확인</Label>
                          <Input
                            id="confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setShowPasswordModal(false)}>
                            취소
                          </Button>
                          <Button onClick={handlePasswordChange}>변경</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
                    <LogOut className="h-4 w-4" />
                    로그아웃
                  </Button>

                  <Button variant="outline" onClick={handleClearData} className="flex items-center gap-2">
                    <RotateCcw className="h-4 w-4" />
                    데이터 초기화
                  </Button>

                  <Button variant="destructive" onClick={handleDeleteAccount} className="flex items-center gap-2">
                    <UserX className="h-4 w-4" />
                    계정 삭제
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

                {/* 카테고리 관리 섹션 */}
                <Card id="category-management">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                카테고리 관리
              </CardTitle>
              <CardDescription>
                할 일 카테고리를 관리하고 색상을 설정합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label className="text-sm font-medium">카테고리 목록</Label>
                <div className="space-y-2">
                  {(settings.categories || []).map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: category.color }}
                        />
                        <Input
                          value={category.name}
                          onChange={(e) => updateCategory(category.id, { name: e.target.value })}
                          className="max-w-32"
                        />
                        <input
                          type="color"
                          value={category.color}
                          onChange={(e) => updateCategory(category.id, { color: e.target.value })}
                          className="w-8 h-8 border rounded cursor-pointer"
                        />
                        {category.isDefault && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            기본
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {!category.isDefault && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDefaultCategory(category.id)}
                          >
                            <Star className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveCategory(category.id)}
                          disabled={category.isDefault}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="새 카테고리 이름"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="flex-1"
                  />
                  <input
                    type="color"
                    value={newCategoryColor}
                    onChange={(e) => setNewCategoryColor(e.target.value)}
                    className="w-10 h-10 border rounded cursor-pointer"
                  />
                  <Button onClick={handleAddCategory} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    추가
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  최대 10개까지 카테고리를 추가할 수 있습니다. ({(settings.categories || []).length}/10)
                </p>
              </div>
            </CardContent>
          </Card>

                {/* 보기 설정 섹션 */}
                <Card id="display-settings">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                보기 설정
              </CardTitle>
              <CardDescription>
                언어, 테마, 색상 및 기본 보기 설정을 관리합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="language-select">언어 설정</Label>
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

                <div className="space-y-2">
                  <Label htmlFor="theme-select">다크 모드 설정</Label>
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

                <div className="space-y-2">
                  <Label htmlFor="default-view-select">기본 보기</Label>
                  <Select value={settings.defaultView} onValueChange={(value) => updateSetting('defaultView', value as AppSettings['defaultView'])}>
                    <SelectTrigger id="default-view-select">
                      <SelectValue placeholder="기본 보기를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month">월간 보기</SelectItem>
                      <SelectItem value="week">주간 보기</SelectItem>
                      <SelectItem value="day">일간 보기</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-sm font-medium">테마 색상</Label>
                <div className="grid grid-cols-6 gap-2">
                  {['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'].map((color) => (
                    <button
                      key={color}
                      onClick={() => updateSetting('themeColor', color)}
                      className={`w-12 h-12 rounded-lg border-2 ${
                        mounted && settings.themeColor === color ? 'border-gray-400' : 'border-gray-200'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom-color">사용자 정의 색상</Label>
                <div className="flex items-center gap-2">
                  <input
                    id="custom-color"
                    type="color"
                    value={mounted ? settings.customColor : '#3B82F6'}
                    onChange={(e) => updateSetting('customColor', e.target.value)}
                    className="w-12 h-12 border rounded cursor-pointer"
                  />
                  <Input
                    value={mounted ? settings.customColor : '#3B82F6'}
                    onChange={(e) => updateSetting('customColor', e.target.value)}
                    placeholder="#000000"
                    className="flex-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

                {/* 캘린더 설정 섹션 */}
                <Card id="calendar-settings">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                캘린더 설정
              </CardTitle>
              <CardDescription>
                날짜 형식, 시간 형식, 타임존 및 주 시작일을 설정합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="date-format-select">날짜 형식</Label>
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

                <div className="space-y-2">
                  <Label htmlFor="time-format-select">시간 형식</Label>
                  <Select value={settings.timeFormat} onValueChange={(value) => updateSetting('timeFormat', value as AppSettings['timeFormat'])}>
                    <SelectTrigger id="time-format-select">
                      <SelectValue placeholder="시간 형식을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24h">24시간 형식</SelectItem>
                      <SelectItem value="12h">12시간 형식</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone-select">타임존</Label>
                  <Select value={settings.timezone} onValueChange={(value) => updateSetting('timezone', value)}>
                    <SelectTrigger id="timezone-select">
                      <SelectValue placeholder="타임존을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Seoul">서울 (KST)</SelectItem>
                      <SelectItem value="Asia/Tokyo">도쿄 (JST)</SelectItem>
                      <SelectItem value="America/New_York">뉴욕 (EST)</SelectItem>
                      <SelectItem value="Europe/London">런던 (GMT)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="week-start-select">주 시작일</Label>
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
              </div>
            </CardContent>
          </Card>

                {/* 할 일 설정 섹션 */}
                <Card id="todo-settings">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Check className="h-5 w-5" />
                할 일 설정
              </CardTitle>
              <CardDescription>
                할 일 표시 방식과 동작을 설정합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="old-todo-limit">오래된 할 일 표시 제한 (일)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="old-todo-limit"
                    type="number"
                    min="1"
                    max="365"
                    value={settings.oldTodoDisplayLimit}
                    onChange={(e) => updateSetting('oldTodoDisplayLimit', parseInt(e.target.value) || 14)}
                    className="w-20"
                  />
                  <span className="text-sm text-gray-500">일 이전 할 일까지 표시</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">완료하지 않은 할 일 자동 이동</Label>
                  <p className="text-sm text-gray-600">완료되지 않은 할 일을 다음 날로 자동 이동합니다</p>
                </div>
                <Switch
                  checked={settings.autoMoveTodos}
                  onCheckedChange={(checked) => updateSetting('autoMoveTodos', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="completed-todo-display">완료된 할 일 표시</Label>
                <Select value={settings.completedTodoDisplay} onValueChange={(value) => updateSetting('completedTodoDisplay', value as AppSettings['completedTodoDisplay'])}>
                  <SelectTrigger id="completed-todo-display">
                    <SelectValue placeholder="완료된 할 일 표시 방식을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">모두 표시</SelectItem>
                    <SelectItem value="yesterday">어제까지만 표시</SelectItem>
                    <SelectItem value="none">표시 안 함</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

                {/* 설정 초기화 섹션 */}
                <Card id="reset-settings">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                설정 초기화
              </CardTitle>
              <CardDescription>
                앱 설정을 기본값으로 초기화합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">주의사항</p>
                      <p className="text-sm text-yellow-700 mt-1">
                        설정을 초기화하면 모든 사용자 정의 설정이 기본값으로 되돌아갑니다. 
                        이 작업은 되돌릴 수 없습니다.
                      </p>
                    </div>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (confirm('정말로 설정을 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
                      resetSettings();
                    }
                  }}
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  설정 초기화
                </Button>
              </div>
            </CardContent>
          </Card>

                {/* 서비스 정보 섹션 */}
                <Card id="service-info">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                서비스 정보
              </CardTitle>
              <CardDescription>
                TODO Calendar 앱에 대한 정보입니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">버전</Label>
                  <p className="text-sm text-gray-600">v1.0.0</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium">최종 업데이트일</Label>
                  <p className="text-sm text-gray-600">{new Date().toLocaleDateString('ko-KR')}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium">문의 이메일</Label>
                  <p className="text-sm text-gray-600">support@todo-calendar.com</p>
                </div>
              </div>
            </CardContent>
                </Card>
              </>
            )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}