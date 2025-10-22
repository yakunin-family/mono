import { Button } from "@mono/ui";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: App });

function App() {
  return (
    <div className="mt-10">
      <Button>test</Button>Hello World
    </div>
  );
}
