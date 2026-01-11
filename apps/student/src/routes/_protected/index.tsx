import { api } from "@app/backend";
import { convexQuery } from "@convex-dev/react-query";
import { Button } from "@package/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";

import { RoleSwitcher } from "@/components/RoleSwitcher";
import { SpaceCard } from "@/components/SpaceCard";
import { signOut } from "@/lib/auth-client";
import { useUser } from "@/providers/user";

export const Route = createFileRoute("/_protected/")({
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useUser();

  const { data: spaces, isLoading } = useQuery(
    convexQuery(api.spaces.getMySpacesAsStudent, {}),
  );

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="flex items-center justify-between px-6 py-4">
          <h1 className="text-2xl font-bold">My Learning</h1>
          <div className="flex items-center gap-4">
            {user.roles.includes("teacher") && (
              <RoleSwitcher currentRole="student" />
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
      <main className="flex-1 bg-muted p-6">
        <div className="mx-auto max-w-4xl">
          <p className="mb-6 text-muted-foreground">
            Your courses and homework
          </p>

          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">
              Loading...
            </div>
          ) : spaces?.length === 0 ? (
            <div className="py-12 text-center">
              <BookOpen className="mx-auto mb-4 size-12 text-muted-foreground opacity-50" />
              <p className="mb-2 text-muted-foreground">
                You haven&apos;t joined any courses yet.
              </p>
              <p className="text-sm text-muted-foreground">
                Ask your teacher for an invite link to get started.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {spaces?.map((space) => (
                <SpaceCard key={space._id} space={space} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
