import { getSignInUrl } from "@workos/authkit-tanstack-react-start";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/login")({
  beforeLoad: async ({ context }) => {
    if (context.user) {
      throw redirect({ to: "/" });
    }
  },
  loader: async () => {
    const signInUrl = await getSignInUrl();
    throw redirect({ href: signInUrl });
  },
});
