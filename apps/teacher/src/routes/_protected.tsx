import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected")({
  beforeLoad: async ({ context }) => {
    if (!context.user) {
      throw redirect({ to: "/login" });
    }

    return {
      user: context.user,
    };
  },
  component: ProtectedLayout,
});

function ProtectedLayout() {
  return <Outlet />;
}
