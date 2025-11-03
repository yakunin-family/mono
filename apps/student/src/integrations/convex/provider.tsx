import { ConvexQueryClient } from "@convex-dev/react-query";
import { ConvexProvider } from "convex/react";

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
}: {
  children: React.ReactNode;
  convexQueryClient: ConvexQueryClient;
}) {
  return (
    <ConvexProvider client={convexQueryClient.convexClient}>
      {children}
    </ConvexProvider>
  );
}
