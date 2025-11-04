import { api } from "@mono/backend";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useConvex } from "convex/react";

import { UserProvider } from "@/providers/user";

export const Route = createFileRoute("/_protected")({
  beforeLoad: async ({ context }) => {
    if (!context.userId) {
      throw redirect({ to: "/login" });
    }

    return {
      userId: context.userId,
    };
  },
  component: ProtectedLayout,
});

function ProtectedLayout() {
  const convex = useConvex();

  const userQuery = useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      const userProfile = await convex.query(api.userProfiles.get, {});

      if (!userProfile) {
        throw new Error("User profile not found. Please contact support.");
      }

      return userProfile;
    },
  });

  if (!userQuery.data) {
    return null;
  }

  return (
    <UserProvider user={userQuery.data}>
      <Outlet />
    </UserProvider>
  );
}
