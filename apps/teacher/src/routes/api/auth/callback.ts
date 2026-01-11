import { handleCallbackRoute } from "@workos/authkit-tanstack-react-start";
import { createFileRoute } from "@tanstack/react-router";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@app/backend";
import { env } from "@/env";

export const Route = createFileRoute("/api/auth/callback")({
  server: {
    handlers: {
      GET: handleCallbackRoute({
        onSuccess: async ({ accessToken }) => {
          const convex = new ConvexHttpClient(env.VITE_CONVEX_URL);
          convex.setAuth(accessToken);
          await convex.mutation(api.userProfiles.createTeacher, {});
        },
      }),
    },
  },
});
