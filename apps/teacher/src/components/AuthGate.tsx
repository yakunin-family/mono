import { Loader2Icon } from "lucide-react";

import { useConvexAuthState } from "@/integrations/convex/provider";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoading } = useConvexAuthState();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}
