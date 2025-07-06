"use client";

import { Settings } from "@/components/settings";
import { AppLayout } from "@/components/AppLayout";
import { useAppContext } from "@/contexts/AppContext";

export default function SettingsPage() {
  const { todos, clearAllTodos } = useAppContext();

  return (
    <AppLayout>
      <div className="h-screen overflow-y-auto">
        <Settings todos={todos} onClearData={clearAllTodos} />
      </div>
    </AppLayout>
  );
}