import { cn, ScrollArea } from "@package/ui";
import { useEffect, useRef } from "react";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  status?: "sending" | "sent" | "error";
}

interface ChatMessagesProps {
  messages: Message[];
  isLoading?: boolean;
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <ScrollArea className="flex-1">
      <div ref={scrollRef} className="flex flex-col gap-3 p-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {isLoading && <TypingIndicator />}
      </div>
    </ScrollArea>
  );
}

interface MessageBubbleProps {
  message: Message;
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isError = message.status === "error";

  return (
    <div
      className={cn("flex", {
        "justify-end": isUser,
        "justify-start": !isUser,
      })}
    >
      <div
        className={cn("max-w-[85%] rounded-2xl px-3 py-2 text-sm", {
          "bg-primary text-primary-foreground": isUser && !isError,
          "bg-muted": !isUser && !isError,
          "bg-destructive/10 text-destructive": isError,
        })}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        {isError && (
          <span className="mt-1 block text-xs opacity-70">Failed to send</span>
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-start">
      <div className="flex gap-1 rounded-2xl bg-muted px-3 py-2">
        <span className="size-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:-0.3s]" />
        <span className="size-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:-0.15s]" />
        <span className="size-2 animate-bounce rounded-full bg-muted-foreground/50" />
      </div>
    </div>
  );
}
