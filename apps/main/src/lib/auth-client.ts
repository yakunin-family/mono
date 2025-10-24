import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  plugins: [convexClient()],
});

// Export auth hooks for easy use in components
export const { useSession, signIn, signOut, signUp } = authClient;
