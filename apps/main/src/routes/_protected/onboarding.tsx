import { api } from "@mono/backend";
import { Button } from "@mono/ui";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/onboarding")({
  beforeLoad: async ({ context }) => {
    const profile = await context.convexQueryClient.serverHttpClient?.query(
      api.userProfiles.getUserProfile,
      {},
    );

    if (!profile) {
      throw redirect({ to: "/login" });
    }

    if (profile.activeRole) {
      throw redirect({ to: "/" });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Welcome!</h1>
          <p className="mt-2 text-muted-foreground">
            Choose how you'd like to get started
          </p>
        </div>

        <div className="grid gap-4">
          <Button
            size="lg"
            onClick={() => navigate({ to: "/teacher/subscribe" })}
            className="h-auto flex-col gap-2 py-6"
          >
            <span className="text-lg font-semibold">I'm a Teacher</span>
            <span className="text-sm font-normal opacity-90">
              Create lessons and invite students
            </span>
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            <p>
              Are you a student? Ask your teacher for an invite link to get
              started.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
