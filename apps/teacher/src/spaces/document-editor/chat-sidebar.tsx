import { Button, cn } from "@package/ui";
import { MessageSquareIcon, XIcon } from "lucide-react";
import type { ReactNode } from "react";

import { type ThreadInfo,ThreadSelector } from "./thread-selector";

export interface ChatSidebarProps {
  onToggle: () => void;
  threads: ThreadInfo[];
  activeThreadId: string | null;
  onSelectThread: (threadId: string) => void;
  onNewThread: () => void;
  onDeleteThread: (threadId: string) => void;
  isLoadingThreads?: boolean;
  children?: ReactNode;
}

export function ChatSidebar({
  onToggle,
  threads,
  activeThreadId,
  onSelectThread,
  onNewThread,
  onDeleteThread,
  isLoadingThreads,
  children,
}: ChatSidebarProps) {
  return (
    <aside
      className={cn("flex h-full shrink-0 flex-col border-l bg-background")}
      aria-label="AI Chat sidebar"
    >
      <ChatHeader
        onClose={onToggle}
        threads={threads}
        activeThreadId={activeThreadId}
        onSelectThread={onSelectThread}
        onNewThread={onNewThread}
        onDeleteThread={onDeleteThread}
        isLoading={isLoadingThreads}
      />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {children}
      </div>
    </aside>
  );
}

interface ChatHeaderProps {
  onClose: () => void;
  threads: ThreadInfo[];
  activeThreadId: string | null;
  onSelectThread: (threadId: string) => void;
  onNewThread: () => void;
  onDeleteThread: (threadId: string) => void;
  isLoading?: boolean;
}

function ChatHeader({
  onClose,
  threads,
  activeThreadId,
  onSelectThread,
  onNewThread,
  onDeleteThread,
  isLoading,
}: ChatHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b px-4">
      <div className="flex items-center gap-2">
        <MessageSquareIcon className="size-4 text-muted-foreground" />
        <ThreadSelector
          threads={threads}
          activeThreadId={activeThreadId}
          onSelectThread={onSelectThread}
          onNewThread={onNewThread}
          onDeleteThread={onDeleteThread}
          isLoading={isLoading}
        />
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        onClick={onClose}
        aria-label="Close chat sidebar"
      >
        <XIcon className="size-4" />
      </Button>
    </header>
  );
}

interface ChatSidebarTriggerProps {
  onClick: () => void;
  className?: string;
}

export function ChatSidebarTrigger({
  onClick,
  className,
}: ChatSidebarTriggerProps) {
  return (
    <Button
      variant="outline"
      size="icon"
      className={cn("size-8", className)}
      onClick={onClick}
      aria-label="Open chat sidebar"
    >
      <MessageSquareIcon className="size-4" />
    </Button>
  );
}
