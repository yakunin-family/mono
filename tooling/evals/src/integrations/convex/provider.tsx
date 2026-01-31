import { ConvexQueryClient } from "@convex-dev/react-query";

export const getContext = () => {
  const convexQueryClient = new ConvexQueryClient(
    process.env.VITE_CONVEX_URL!,
    {
      unsavedChangesWarning: false,
      expectAuth: false,
    },
  );

  return {
    convexQueryClient,
  };
};
