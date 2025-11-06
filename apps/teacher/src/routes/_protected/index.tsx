import { Button } from "@mono/ui";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { signOut } from "@/lib/auth-client";

export const Route = createFileRoute("/_protected/")({
  component: DashboardPage,
});

const createLink = (userId: string) => {
  if (process.env.NODE_ENV === "development") {
    return `http://localhost:3001/join/${userId}`;
  }

  return `https://student.untitled.nikita-yakunin.dev/join/${userId}`;
};

function DashboardPage() {
  const navigate = useNavigate();
  const { userId } = Route.useRouteContext();
  const [copySuccess, setCopySuccess] = useState(false);

  const inviteLink = createLink(userId);

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
      <main className="flex-1 bg-muted p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="rounded-lg border bg-background p-6">
            <h2 className="mb-4 text-lg font-semibold">
              Invite Students to Join Your Classes
            </h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Share this permanent link with your students. They can use it
              anytime to join your classes.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={inviteLink}
                className="flex-1 rounded border bg-muted px-3 py-2 text-sm"
              />
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(inviteLink);
                  setCopySuccess(true);
                  setTimeout(() => setCopySuccess(false), 2000);
                }}
              >
                {copySuccess ? "Copied!" : "Copy"}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
