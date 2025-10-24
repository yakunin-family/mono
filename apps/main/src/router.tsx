/* eslint-disable react/react-in-jsx-scope */
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";

import * as Convex from "./integrations/convex/provider";
import * as TanstackQuery from "./integrations/tanstack-query/root-provider";
// Import the generated route tree
import { routeTree } from "./routeTree.gen";

// Create a new router instance
export const getRouter = () => {
  const convexContext = Convex.getContext();
  const rqContext = TanstackQuery.getContext(convexContext.convexQueryClient);
  convexContext.convexQueryClient.connect(rqContext.queryClient);

  const router = createRouter({
    routeTree,
    context: {
      ...rqContext,
      convexQueryClient: convexContext.convexQueryClient,
    },
    defaultPreload: "intent",
    Wrap: (props: { children: React.ReactNode }) => {
      return (
        <TanstackQuery.Provider {...rqContext}>
          {props.children}
        </TanstackQuery.Provider>
      );
    },
  });

  setupRouterSsrQueryIntegration({
    router,
    queryClient: rqContext.queryClient,
  });

  return router;
};
