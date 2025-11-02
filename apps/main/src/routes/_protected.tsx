import { fetchSession } from "@convex-dev/better-auth/react-start";
import { api } from "@mono/backend";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getRequest } from "@tanstack/react-start/server";

import { UserProvider } from "@/providers/user";

export const Route = createFileRoute("/_protected")({
  beforeLoad: async ({ context }) => {
    const { session } = await fetchSession(getRequest());

    // Check if user is authenticated
    if (!session?.user.id) {
      throw redirect({
        to: "/login",
      });
    }

    const user = await context.convexQueryClient.convexClient.query(
      api.userProfiles.getUserProfile,
      {},
    );

    if (!user) {
      await context.convexQueryClient.convexClient.mutation(
        api.userProfiles.createUserProfile,
        {
          userId: session.user.id,
          displayName: session.user.name || "New User",
        },
      );

      throw redirect({ to: "/onboarding" });
    }

    return { user };
  },
  component: ProtectedLayout,
});

function ProtectedLayout() {
  const { user } = Route.useRouteContext();

  return (
    <UserProvider user={user}>
      <Outlet />
    </UserProvider>
  );
}
