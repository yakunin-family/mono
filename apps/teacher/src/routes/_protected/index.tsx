import { api } from "@app/backend";
import { Button } from "@package/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useConvex } from "convex/react";
import { LibraryIcon, PlusIcon, UsersIcon } from "lucide-react";
import { useState } from "react";

import { CreateInviteDialog } from "@/components/CreateInviteDialog";
import { InvitesList } from "@/components/InvitesList";
import { SpaceCard } from "@/components/SpaceCard";
import { useAuth } from "@/lib/auth-client";

export const Route = createFileRoute("/_protected/")({
  component: DashboardPage,
});

function DashboardPage() {
  const convex = useConvex();
  const { signOut } = useAuth();
  const [showCreateInvite, setShowCreateInvite] = useState(false);

  // Fetch spaces where user is teacher
  const spacesQuery = useQuery({
    queryKey: ["spaces"],
    queryFn: async () => {
      return await convex.query(api.spaces.getMySpacesAsTeacher, {});
    },
  });

  // Fetch pending invites
  const invitesQuery = useQuery({
    queryKey: ["spaceInvites"],
    queryFn: async () => {
      return await convex.query(api.spaceInvites.getMyInvites, {});
    },
  });

  const pendingInvites =
    invitesQuery.data?.filter((invite) => invite.isPending) ?? [];

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="flex items-center justify-between px-6 py-4">
          <h1 className="text-2xl font-bold">
            Language Learning Platform - Teacher
          </h1>
          <div className="flex items-center gap-4">
            <Link to="/library">
              <Button variant="outline" size="sm">
                <LibraryIcon className="mr-2 size-4" />
                Library
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut({ returnTo: "/login" })}
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 bg-muted p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Students Section Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Your Students</h2>
            <Button onClick={() => setShowCreateInvite(true)}>
              <PlusIcon className="mr-2 size-4" />
              Invite Student
            </Button>
          </div>

          {/* Pending Invites Section */}
          {pendingInvites.length > 0 && (
            <div className="rounded-lg border bg-background p-6">
              <h3 className="mb-4 text-lg font-semibold text-muted-foreground">
                Pending Invites ({pendingInvites.length})
              </h3>
              <InvitesList invites={pendingInvites} />
            </div>
          )}

          {/* Spaces List */}
          <div className="rounded-lg border bg-background p-6">
            {spacesQuery.isLoading ? (
              <div className="py-8 text-center text-muted-foreground">
                Loading...
              </div>
            ) : spacesQuery.error ? (
              <div className="py-8 text-center text-red-600">
                Error loading students
              </div>
            ) : spacesQuery.data && spacesQuery.data.length > 0 ? (
              <div className="space-y-3">
                {spacesQuery.data.map((space) => (
                  <SpaceCard key={space._id} space={space} />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <UsersIcon className="mx-auto mb-3 size-12 text-muted-foreground opacity-50" />
                <p className="mb-4 text-sm text-muted-foreground">
                  You do not have any students yet.
                </p>
                <Button onClick={() => setShowCreateInvite(true)}>
                  <PlusIcon className="mr-2 size-4" />
                  Invite Your First Student
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create Invite Dialog */}
      <CreateInviteDialog
        open={showCreateInvite}
        onOpenChange={setShowCreateInvite}
      />
    </div>
  );
}
