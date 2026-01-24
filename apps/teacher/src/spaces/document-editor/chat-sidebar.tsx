import { Button, cn } from "@package/ui";
import { MessageSquareIcon, XIcon } from "lucide-react";
import type { ReactNode } from "react";

interface ChatSidebarProps {
  onToggle: () => void;
  children?: ReactNode;
}

export function ChatSidebar({ onToggle, children }: ChatSidebarProps) {
  return (
    <aside
      className={cn("flex h-full shrink-0 flex-col border-l bg-background")}
      aria-label="AI Chat sidebar"
    >
      <ChatHeader onClose={onToggle} />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {children}
      </div>
    </aside>
  );
}

interface ChatHeaderProps {
  onClose: () => void;
}

function ChatHeader({ onClose }: ChatHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b px-4">
      <div className="flex items-center gap-2">
        <MessageSquareIcon className="size-4 text-muted-foreground" />
        <h2 className="text-sm font-medium">AI Chat</h2>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onClose}
        aria-label="Close chat sidebar"
      >
        <XIcon className="size-4" />
      </Button>
    </header>
  );
}

interface ChatSidebarTriggerProps {
  isOpen: boolean;
  onClick: () => void;
}

export function ChatSidebarTrigger({
  isOpen,
  onClick,
}: ChatSidebarTriggerProps) {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={onClick}
      aria-label={isOpen ? "Close AI chat" : "Open AI chat"}
      aria-expanded={isOpen}
    >
      <MessageSquareIcon className="size-4" />
    </Button>
  );
}
