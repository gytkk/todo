"use client";

import { StatisticsPage } from "@/components/statistics/StatisticsPage";
import { AppLayout } from "@/components/AppLayout";
import { useAppContext } from "@/contexts/AppContext";

export default function Statistics() {
  const { todos } = useAppContext();

  return (
    <AppLayout>
      <div className="h-screen overflow-y-auto">
        <div className="p-6">
          <StatisticsPage todos={todos} />
        </div>
      </div>
    </AppLayout>
  );
}