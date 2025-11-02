import { useConvex } from "@convex-dev/react-query";
import { api } from "@mono/backend";
import { Button } from "@mono/ui";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { RoleSwitcher } from "@/components/RoleSwitcher";
import { StudentDashboard } from "@/components/StudentDashboard";
import { TeacherDashboard } from "@/components/TeacherDashboard";
import { signOut } from "@/lib/auth-client";
import { useUser } from "@/providers/user";

export const Route = createFileRoute("/_protected/")({
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const convex = useConvex();
  const { user } = useUser();

  const updateLastUsedRoleMutation = useMutation({
    mutationFn: async (role: "teacher" | "student") => {
      return convex.mutation(api.userProfiles.updateLastUsedRole, { role });
    },
  });

  const handleRoleChange = (newRole: "teacher" | "student") => {
    updateLastUsedRoleMutation.mutate(newRole);
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="flex items-center justify-between px-6 py-4">
          <h1 className="text-2xl font-bold">Language Learning Platform</h1>
          <div className="flex items-center gap-4">
            {user.activeRole && (
              <RoleSwitcher
                currentRole={user.activeRole}
                availableRoles={{
                  teacher: user.isTeacherActive || false,
                  student: user.isStudentActive || false,
                }}
                onRoleChange={handleRoleChange}
              />
            )}
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
      <main className="flex-1 bg-muted">
        {user.activeRole === "teacher" && <TeacherDashboard />}
        {user.activeRole === "student" && <StudentDashboard />}
      </main>
    </div>
  );
}
