import { createFileRoute, redirect } from "@tanstack/react-router";
import { getSignUpUrl } from "@workos/authkit-tanstack-react-start";

export const Route = createFileRoute("/_auth/signup")({
  beforeLoad: async ({ context }) => {
    if (context.user) {
      throw redirect({ to: "/" });
    }
  },
  loader: async () => {
    const signUpUrl = await getSignUpUrl();
    throw redirect({ href: signUpUrl });
  },
});
