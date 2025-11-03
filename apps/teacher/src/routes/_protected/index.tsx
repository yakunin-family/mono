import { Button } from "@mono/ui";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { RoleSwitcher } from "@/components/RoleSwitcher";
import { TeacherDashboard } from "@/components/TeacherDashboard";
import { signOut } from "@/lib/auth-client";
import { useUser } from "@/providers/user";

export const Route = createFileRoute("/_protected/")({
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useUser();

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="flex items-center justify-between px-6 py-4">
          <h1 className="text-2xl font-bold">
            Language Learning Platform - Teacher
          </h1>
          <div className="flex items-center gap-4">
            {user.isStudentActive && <RoleSwitcher currentRole="teacher" />}
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await signOut();
                navigate({ to: "/login" });
              }}
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 bg-muted">{/* <TeacherDashboard /> */}</main>
    </div>
  );
}
