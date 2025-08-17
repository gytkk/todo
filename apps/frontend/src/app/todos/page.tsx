"use client";

import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/common/PageHeader";
import { TodosPage } from "@/components/todos";
import { withAuth } from "@/contexts/AuthContext";

function Todos() {
  return (
    <AppLayout>
      <PageHeader title="할 일" />
      <div className="h-[calc(100vh-4rem)] bg-white overflow-y-auto">
        <div className="p-6">
          <TodosPage />
        </div>
      </div>
    </AppLayout>
  );
}

// withAuth HOC로 페이지 보호
export default withAuth(Todos);