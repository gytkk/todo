"use client";

import { Settings } from "@/components/settings";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/common/PageHeader";
import { useAppContext } from "@/contexts/AppContext";

export default function SettingsPage() {
  const { todos, clearAllTodos } = useAppContext();

  return (
    <AppLayout>
      <PageHeader title="설정" />
      <div className="h-[calc(100vh-4rem)] overflow-y-auto">
        <Settings todos={todos} onClearData={clearAllTodos} />
      </div>
    </AppLayout>
  );
}