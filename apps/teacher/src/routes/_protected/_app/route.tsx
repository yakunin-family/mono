import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@package/ui";
import {
  createFileRoute,
  Link,
  Outlet,
  useRouteContext,
} from "@tanstack/react-router";
import { HomeIcon, LibraryIcon } from "lucide-react";

import { NavUser } from "@/components/sidebar/nav-user";

export const Route = createFileRoute("/_protected/_app")({
  component: RouteComponent,
});

function RouteComponent() {
  const { user } = useRouteContext({ from: "/_protected" });

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
        </SidebarContent>
        <SidebarFooter>
          <NavUser
            user={{
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
