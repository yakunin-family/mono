import {
  Button,
  cn,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  ScrollArea,
} from "@package/ui";
import {
  ChevronDownIcon,
  MessageSquarePlusIcon,
  Trash2Icon,
} from "lucide-react";
import { useState } from "react";

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return new Date(timestamp).toLocaleDateString();
}

export interface ThreadInfo {
  threadId: string;
  documentId: string;
  createdAt: number;
  preview: string | null;
  messageCount: number;
}

interface ThreadSelectorProps {
  threads: ThreadInfo[];
  activeThreadId: string | null;
  onSelectThread: (threadId: string) => void;
  onNewThread: () => void;
  onDeleteThread: (threadId: string) => void;
  isLoading?: boolean;
}

export function ThreadSelector({
  threads,
  activeThreadId,
  onSelectThread,
  onNewThread,
  onDeleteThread,
  isLoading,
}: ThreadSelectorProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [threadToDelete, setThreadToDelete] = useState<string | null>(null);

  const activeThread = threads.find((t) => t.threadId === activeThreadId);
  const isNewConversation = activeThreadId === null;

  const handleDeleteClick = (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setThreadToDelete(threadId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (threadToDelete) {
      onDeleteThread(threadToDelete);
      setDeleteDialogOpen(false);
      setThreadToDelete(null);
    }
  };

  const getThreadLabel = () => {
    if (isNewConversation) {
      return "New conversation";
    }
    if (activeThread?.preview) {
      return activeThread.preview.length > 30
        ? `${activeThread.preview.slice(0, 30)}...`
        : activeThread.preview;
    }
    return "Conversation";
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="sm"
              className="h-auto gap-1 px-2 py-1 font-normal"
              disabled={isLoading}
            >
              <span className="max-w-[180px] truncate text-sm">
                {getThreadLabel()}
              </span>
              <ChevronDownIcon className="size-3.5 text-muted-foreground" />
            </Button>
          }
        />
        <DropdownMenuContent align="start" className="w-72">
          <DropdownMenuItem onClick={onNewThread}>
            <MessageSquarePlusIcon className="size-4" />
            <span>New conversation</span>
          </DropdownMenuItem>

          {threads.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <ScrollArea className="max-h-64">
                {threads.map((thread) => (
                  <ThreadListItem
                    key={thread.threadId}
                    thread={thread}
                    isActive={thread.threadId === activeThreadId}
                    onSelect={() => onSelectThread(thread.threadId)}
                    onDelete={(e) => handleDeleteClick(thread.threadId, e)}
                  />
                ))}
              </ScrollArea>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this conversation?</DialogTitle>
            <DialogDescription>
              This will permanently delete this conversation and all its
              messages. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface ThreadListItemProps {
  thread: ThreadInfo;
  isActive: boolean;
  onSelect: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

function ThreadListItem({
  thread,
  isActive,
  onSelect,
  onDelete,
}: ThreadListItemProps) {
  const preview = thread.preview || "Empty conversation";
  const timeAgo = formatTimeAgo(thread.createdAt);

  return (
    <DropdownMenuItem
      onClick={onSelect}
      className={cn("group relative flex-col items-start gap-0.5 pr-8", {
        "bg-accent": isActive,
      })}
    >
      <span className="line-clamp-1 w-full text-sm">{preview}</span>
      <span className="text-xs text-muted-foreground">{timeAgo}</span>
      <button
        onClick={onDelete}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 opacity-0 transition-opacity hover:bg-destructive/10 group-hover:opacity-100"
        aria-label="Delete conversation"
      >
        <Trash2Icon className="size-3.5 text-destructive" />
      </button>
    </DropdownMenuItem>
  );
}
