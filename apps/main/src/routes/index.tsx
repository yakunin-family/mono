/* eslint-disable react/react-in-jsx-scope */
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { api } from "@mono/backend/convex/_generated/api";
import { Button } from "@mono/ui";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: App });

function App() {
  const data = useQuery(convexQuery(api.todos.list, {}));
  const add = useMutation({
    mutationFn: useConvexMutation(api.todos.add),
  });

  return (
    <div className="mt-10">
      <Button onClick={() => add.mutate({ text: "New Todo" })}>test</Button>
      Hello World
      {JSON.stringify(data.data || "[]")}
    </div>
  );
}
