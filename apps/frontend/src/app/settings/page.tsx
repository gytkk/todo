"use client";

import { Settings } from "@/components/settings";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/common/PageHeader";
import { useTodoContext } from "@/contexts/AppContext";
import { withAuth } from "@/contexts/AuthContext";

function SettingsPage() {
  const { todos, clearAllTodos } = useTodoContext();

  return (
    <AppLayout>
      <PageHeader title="설정" />
      <div className="h-[calc(100vh-4rem)] overflow-y-auto">
        <Settings todos={todos} onClearData={clearAllTodos} />
      </div>
    </AppLayout>
  );
}

// withAuth HOC로 페이지 보호
export default withAuth(SettingsPage);