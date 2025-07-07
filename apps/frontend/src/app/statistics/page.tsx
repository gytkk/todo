"use client";

import { StatisticsPage } from "@/components/statistics/StatisticsPage";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/common/PageHeader";
import { useAppContext } from "@/contexts/AppContext";

export default function Statistics() {
  const { todos } = useAppContext();

  return (
    <AppLayout>
      <PageHeader title="통계" />
      <div className="h-[calc(100vh-4rem)] bg-white overflow-y-auto">
        <div className="p-6">
          <StatisticsPage todos={todos} />
        </div>
      </div>
    </AppLayout>
  );
}