import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { AuthGate } from "@/components/AuthGate";

export const Route = createFileRoute("/_protected")({
  beforeLoad: async ({ context }) => {
    if (!context.isAuthenticated) {
      throw redirect({ to: "/login" });
    }
  },
  component: ProtectedLayout,
});

function ProtectedLayout() {
  return (
    <AuthGate>
      <Outlet />
    </AuthGate>
  );
}
