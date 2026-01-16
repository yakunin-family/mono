import { api } from "@app/backend";
import { convexQuery } from "@convex-dev/react-query";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@package/ui";
import { useQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  Link,
  Outlet,
  useRouteContext,
} from "@tanstack/react-router";
import { HomeIcon, LibraryIcon } from "lucide-react";

import { NavUser } from "@/components/sidebar/nav-user";
import { UserAvatar } from "@/components/user-avatar";

export const Route = createFileRoute("/_protected/_app")({
  loader: async ({ context }) => {
    const spaces = await context.queryClient.ensureQueryData(
      convexQuery(api.spaces.getMySpacesAsTeacher, {}),
    );
    return { spaces };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { spaces: preloadedSpaces } = Route.useLoaderData();
  const { user } = useRouteContext({ from: "/_protected" });

  const spacesQuery = useQuery({
    ...convexQuery(api.spaces.getMySpacesAsTeacher, {}),
  });

  const spaces = spacesQuery.data ?? preloadedSpaces;

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "User";

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" variant="inset">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={
                      <Link to="/">
                        <HomeIcon />
                        <span>Home</span>
                      </Link>
                    }
                  />
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={
                      <Link to="/library">
                        <LibraryIcon />
                        <span>Library</span>
                      </Link>
                    }
                  />
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>Students</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {spaces?.map((space) => (
                  <SidebarMenuItem key={space._id}>
                    <SidebarMenuButton
                      render={
                        <Link to="/spaces/$id" params={{ id: space._id }}>
                          <UserAvatar
                            id={space.studentId}
                            pictureUrl={space.studentPictureUrl}
                            name={space.studentName}
                            size={16}
                          />
                          <span>{space.studentName}</span>
                        </Link>
                      }
                    />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <NavUser
            user={{
              id: user?.id ?? "",
              name: displayName,
              email: user?.email ?? "",
            }}
          />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
