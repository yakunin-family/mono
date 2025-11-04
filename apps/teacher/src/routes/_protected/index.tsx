import { useConvex } from "@convex-dev/react-query";
import { api } from "@mono/backend";
import { Button } from "@mono/ui";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { signOut } from "@/lib/auth-client";

export const Route = createFileRoute("/_protected/")({
  component: DashboardPage,
});

const createLink = (token: string) => {
  if (process.env.NODE_ENV === "development") {
    return `http://localhost:3001/join/${token}`;
  }

  return `https://student.untitled.nikita-yakunin.dev/join/${token}`;
};

function DashboardPage() {
  const navigate = useNavigate();
  const convex = useConvex();
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  const createStudentMutation = useMutation({
    mutationFn: async () => convex.mutation(api.invite.getToken, {}),
    onSuccess: (token) => setInviteLink(createLink(token)),
  });

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="flex items-center justify-between px-6 py-4">
          <h1 className="text-2xl font-bold">
            Language Learning Platform - Teacher
          </h1>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await signOut();
                navigate({ to: "/login" });
              }}
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 bg-muted">
        <Button onClick={() => createStudentMutation.mutate()}>
          Invite Student {createStudentMutation.isPending && "..."}
        </Button>
        {inviteLink && (
          <div className="mt-4">
            <p className="mb-2">Invite Link:</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={inviteLink}
                className="w-full rounded border px-3 py-2"
              />
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(inviteLink);
                  alert("Invite link copied to clipboard!");
                }}
              >
                Copy
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
