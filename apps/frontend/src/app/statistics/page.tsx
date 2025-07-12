"use client";

import { StatisticsPage } from "@/components/statistics/StatisticsPage";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/common/PageHeader";
import { useTodoContext } from "@/contexts/AppContext";
import { withAuth } from "@/contexts/AuthContext";

function Statistics() {
  const { todos } = useTodoContext();

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

// withAuth HOC로 페이지 보호
export default withAuth(Statistics);