import { ConvexQueryClient } from "@convex-dev/react-query";
import { getAuth } from "@workos/authkit-tanstack-react-start";
import { AuthKitProvider } from "@workos/authkit-tanstack-react-start/client";
import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Scripts,
  useRouteContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { createServerFn } from "@tanstack/react-start";

import ConvexProvider from "../integrations/convex/provider";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import appCss from "../styles.css?url";

interface WorkOSUser {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

interface MyRouterContext {
  queryClient: QueryClient;
  convexQueryClient: ConvexQueryClient;
  user?: WorkOSUser | null;
  accessToken?: string | null;
}

const fetchAuth = createServerFn({ method: "GET" }).handler(async () => {
  const auth = await getAuth();
  return {
    user: auth.user
      ? {
          id: auth.user.id,
          email: auth.user.email ?? undefined,
          firstName: auth.user.firstName ?? undefined,
          lastName: auth.user.lastName ?? undefined,
        }
      : null,
    accessToken: auth.user ? (auth as { accessToken: string }).accessToken : null,
  };
});

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Student - Language Learning Platform",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),

  beforeLoad: async (ctx) => {
    const { user, accessToken } = await fetchAuth();

    if (accessToken) {
      ctx.context.convexQueryClient.serverHttpClient?.setAuth(accessToken);
    }

    return { user, accessToken };
  },

  shellComponent: RootDocument,
  notFoundComponent: () => <div>404 Not Found</div>,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  const context = useRouteContext({ from: Route.id });

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <AuthKitProvider>
          <ConvexProvider
            convexQueryClient={context.convexQueryClient}
            accessToken={context.accessToken}
          >
            {children}
            <TanStackDevtools
              config={{
                position: "bottom-right",
              }}
              plugins={[
                {
                  name: "Tanstack Router",
                  render: <TanStackRouterDevtoolsPanel />,
                },
                TanStackQueryDevtools,
              ]}
            />
          </ConvexProvider>
        </AuthKitProvider>
        <Scripts />
      </body>
    </html>
  );
}
