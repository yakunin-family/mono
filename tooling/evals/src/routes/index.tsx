import { createFileRoute } from "@tanstack/react-router";
import { ChatPane } from "../components/chat-pane";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <div className="p-4 h-screen box-border">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
        <div className="h-full">
          <ChatPane title="Agent A" />
        </div>
        <div className="h-full">
          <ChatPane title="Agent B" />
        </div>
      </div>
    </div>
  );
}
