import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/dashboard")({
  loader: async ({ context }) => {},
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/protected/dashboard"!</div>;
}
