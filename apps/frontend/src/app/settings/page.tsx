"use client";

import { lazy, Suspense } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/common/PageHeader";
import { withAuth } from "@/contexts/AuthContext";

// 설정 컴포넌트를 지연 로딩 (성능 최적화 유지)
const Settings = lazy(() => import("@/components/settings").then(module => ({ default: module.Settings })));

function SettingsPage() {
  // 설정 페이지에서는 todos 데이터가 필요하지 않으므로 제거
  const handleClearData = () => {
    // 필요 시 여기서 직접 데이터 정리 로직 구현
    console.log('데이터 정리 요청');
  };

  return (
    <AppLayout>
      <PageHeader title="설정" />
      <div className="h-[calc(100vh-4rem)] overflow-y-auto">
        <Suspense 
          fallback={
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          }
        >
          <Settings todos={[]} onClearData={handleClearData} />
        </Suspense>
      </div>
    </AppLayout>
  );
}

// withAuth HOC로 페이지 보호
export default withAuth(SettingsPage);