import type { Id } from "@app/backend";
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@package/ui";
import { ChevronDownIcon, MessageSquareIcon, XIcon } from "lucide-react";
import type { ReactNode } from "react";

import type { ChatSession } from "./use-chat";

interface ChatSidebarProps {
  onToggle: () => void;
  sessions: ChatSession[];
  currentSessionId: Id<"chatSessions"> | null;
  onSessionSelect: (sessionId: Id<"chatSessions">) => void;
  children?: ReactNode;
}

export function ChatSidebar({
  onToggle,
  sessions,
  currentSessionId,
  onSessionSelect,
  children,
}: ChatSidebarProps) {
  return (
    <aside
      className={cn("flex h-full shrink-0 flex-col border-l bg-background")}
      aria-label="AI Chat sidebar"
    >
      <ChatHeader
        onClose={onToggle}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSessionSelect={onSessionSelect}
      />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {children}
      </div>
    </aside>
  );
}

interface ChatHeaderProps {
  onClose: () => void;
  sessions: ChatSession[];
  currentSessionId: Id<"chatSessions"> | null;
  onSessionSelect: (sessionId: Id<"chatSessions">) => void;
}

function formatSessionDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function ChatHeader({
  onClose,
  sessions,
  currentSessionId,
  onSessionSelect,
}: ChatHeaderProps) {
  const currentIndex = sessions.findIndex((s) => s._id === currentSessionId);
  const hasMultipleSessions = sessions.length > 1;

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b px-4">
      <div className="flex items-center gap-2">
        <MessageSquareIcon className="size-4 text-muted-foreground" />
        {hasMultipleSessions ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex h-auto items-center gap-1 rounded-md px-1 py-0.5 text-sm font-medium hover:bg-accent">
              Session{" "}
              {currentIndex === 0
                ? "(current)"
                : `#${sessions.length - currentIndex}`}
              <ChevronDownIcon className="size-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {sessions.map((session, index) => (
                <DropdownMenuItem
                  key={session._id}
                  onClick={() => onSessionSelect(session._id)}
                  className={cn(
                    session._id === currentSessionId && "bg-accent",
                  )}
                >
                  <div className="flex w-full items-center justify-between">
                    <span>
                      {index === 0
                        ? "Current session"
                        : `Session #${sessions.length - index}`}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatSessionDate(session.createdAt)}
                    </span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <h2 className="text-sm font-medium">AI Chat</h2>
        )}
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
