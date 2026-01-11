import { ConvexQueryClient } from "@convex-dev/react-query";
import { ConvexProvider } from "convex/react";
import { useEffect } from "react";

import { env } from "@/env";

export const getContext = () => {
  const convexQueryClient = new ConvexQueryClient(env.VITE_CONVEX_URL, {
    unsavedChangesWarning: false,
  });

  return {
    convexQueryClient,
  };
};

export default function AppConvexProvider({
  children,
  convexQueryClient,
  accessToken,
}: {
  children: React.ReactNode;
  convexQueryClient: ConvexQueryClient;
  accessToken?: string | null;
}) {
  useEffect(() => {
    if (accessToken) {
      convexQueryClient.convexClient.setAuth(async () => accessToken);
    } else {
      convexQueryClient.convexClient.clearAuth();
    }
  }, [accessToken, convexQueryClient]);

  return (
    <ConvexProvider client={convexQueryClient.convexClient}>
      {children}
    </ConvexProvider>
  );
}
