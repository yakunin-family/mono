import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
  useRouteContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { createServerFn } from "@tanstack/react-start";

import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import { authClient } from "../lib/auth-client";
import { getToken } from "../lib/auth-server";
import appCss from "../styles.css?url";

interface MyRouterContext {
  queryClient: QueryClient;
  convexQueryClient: ConvexQueryClient;
  // These are populated in beforeLoad
  isAuthenticated?: boolean;
  token?: string | null;
}

// Get auth information for SSR using available cookies
const getAuth = createServerFn({ method: "GET" }).handler(async () => {
  return await getToken();
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
    const token = await getAuth();

    // All queries, mutations and actions through TanStack Query will be
    // authenticated during SSR if we have a valid token
    if (token) {
      // During SSR only (the only time serverHttpClient exists),
      // set the auth token to make HTTP queries with.
      ctx.context.convexQueryClient.serverHttpClient?.setAuth(token);
    }

    return {
      isAuthenticated: !!token,
      token,
    };
  },

  shellComponent: RootDocument,
  component: RootComponent,
  notFoundComponent: () => <div>404 Not Found</div>,
});

function RootComponent() {
  return <Outlet />;
}

function RootDocument({ children }: { children: React.ReactNode }) {
  const context = useRouteContext({ from: Route.id });

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <ConvexBetterAuthProvider
          client={context.convexQueryClient.convexClient}
          authClient={authClient}
          initialToken={context.token}
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
        </ConvexBetterAuthProvider>
        <Scripts />
      </body>
    </html>
  );
}
