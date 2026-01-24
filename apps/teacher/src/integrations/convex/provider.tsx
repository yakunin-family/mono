import { ConvexQueryClient } from "@convex-dev/react-query";

import { env } from "@/env";

export const getContext = () => {
  const convexQueryClient = new ConvexQueryClient(env.VITE_CONVEX_URL, {
    unsavedChangesWarning: false,
    expectAuth: true,
  });

  return {
    convexQueryClient,
  };
};
