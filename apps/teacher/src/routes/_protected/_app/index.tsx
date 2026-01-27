import { api } from "@app/backend";
import {
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@package/ui";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ClockIcon, PlusIcon } from "lucide-react";
import { useState } from "react";

import { AppContent, AppHeader } from "@/components/app-shell";
import { CreateInviteDialog } from "@/components/CreateInviteDialog";
import { InvitesList } from "@/spaces/home/invites-list";
import { SpacesList } from "@/spaces/home/spaces-list";

export const Route = createFileRoute("/_protected/_app/")({
  component: DashboardPage,
});

function DashboardPage() {
  const [showCreateInvite, setShowCreateInvite] = useState(false);

  const allInvitesQuery = useQuery(
    convexQuery(api.spaceInvites.getMyInvites, {}),
  );

  const pendingInvites =
    allInvitesQuery.data?.filter((invite) => invite.isPending) ?? [];

  return (
    <>
      <AppHeader>
        <div className="flex justify-between w-full items-center">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Home</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex gap-2">
            {allInvitesQuery.isSuccess && pendingInvites.length > 0 && (
              <Popover>
                <PopoverTrigger
                  render={
                    <Button variant="ghost">
                      <ClockIcon className="mr-2 size-4" />
                      Pending Invites
                      <Badge variant="secondary" className="ml-2">
                        {pendingInvites.length}
                      </Badge>
                    </Button>
                  }
                />
                <PopoverContent align="end" className="w-80">
                  <h3 className="mb-1 text-sm font-medium">Pending Invites</h3>
                  <InvitesList invites={pendingInvites} />
                </PopoverContent>
              </Popover>
            )}
            <Button onClick={() => setShowCreateInvite(true)}>
              <PlusIcon className="mr-2 size-4" />
              Invite Student
            </Button>
          </div>
        </div>
      </AppHeader>

      <AppContent className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your Students</h2>
        </div>

        <SpacesList onInviteClick={() => setShowCreateInvite(true)} />
      </AppContent>

      <CreateInviteDialog
        open={showCreateInvite}
        onOpenChange={setShowCreateInvite}
      />
    </>
  );
}
