import { ConvexQueryClient } from "@convex-dev/react-query";
import { ConvexProvider } from "convex/react";
import { createContext, useContext, useEffect, useState } from "react";

import { env } from "@/env";

interface ConvexAuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
}

const ConvexAuthContext = createContext<ConvexAuthState>({
  isLoading: true,
  isAuthenticated: false,
});

export function useConvexAuthState() {
  return useContext(ConvexAuthContext);
}

export const getContext = () => {
  const convexQueryClient = new ConvexQueryClient(env.VITE_CONVEX_URL, {
    unsavedChangesWarning: false,
    expectAuth: true,
  });

  return {
    convexQueryClient,
  };
};

export default function AppConvexProvider({
  children,
  convexQueryClient,
  accessToken,
}: {
  children: React.ReactNode;
  convexQueryClient: ConvexQueryClient;
  accessToken?: string | null;
}) {
  const [authState, setAuthState] = useState<ConvexAuthState>({
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    if (accessToken) {
      convexQueryClient.convexClient.setAuth(async () => accessToken);
      setAuthState({ isLoading: false, isAuthenticated: true });
    } else {
      convexQueryClient.convexClient.clearAuth();
      setAuthState({ isLoading: false, isAuthenticated: false });
    }
  }, [accessToken, convexQueryClient]);

  return (
    <ConvexAuthContext.Provider value={authState}>
      <ConvexProvider client={convexQueryClient.convexClient}>
        {children}
      </ConvexProvider>
    </ConvexAuthContext.Provider>
  );
}
