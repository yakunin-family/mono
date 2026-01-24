import { useMutation } from "@tanstack/react-query";
import { useConvexMutation } from "@convex-dev/react-query";
import { Loader2Icon } from "lucide-react";
import { useEffect, useRef } from "react";

import { api } from "@app/backend";
import { useSession } from "@/lib/auth-client";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const hasEnsuredRole = useRef(false);

  const { mutate: ensureTeacherRole } = useMutation({
    mutationFn: useConvexMutation(api.userProfiles.ensureTeacherRole),
  });

  useEffect(() => {
    if (session?.user && !hasEnsuredRole.current) {
      hasEnsuredRole.current = true;
      ensureTeacherRole({});
    }
  }, [session?.user, ensureTeacherRole]);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}
