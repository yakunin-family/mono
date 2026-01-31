import { useEffect, useState } from "react";
import { useConvex } from "convex/react";
import { toUIMessages, useThreadMessages } from "@convex-dev/agent/react";
import { Button, Card, ScrollArea, Spinner, Textarea } from "@package/ui";
import { api } from "../../convex/_generated/api";
import { Message } from "./message";
import { VariantSelector } from "./variant-selector";
import type { UIMessage } from "@convex-dev/agent/react";

export function ChatPane({ title }: { title?: string }) {
  const convex = useConvex();
  const [threadId, setThreadId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [variant, setVariant] = useState("latest");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    // create a thread on mount
    let cancelled = false;
    (async () => {
      try {
        const res = await convex.mutation(api.chat.createThread, {});
        if (!cancelled) setThreadId(res.threadId);
      } catch (e) {
        console.error("createThread failed", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [convex, isClient]);

  // Use the agent's thread messages (streaming) - only on client
  const messagesResult = useThreadMessages(
    api.chat.listThreadMessages,
    threadId && isClient ? { threadId } : "skip",
    isClient
      ? { initialNumItems: 50, stream: true }
      : { initialNumItems: 0, stream: false },
  );

  const messages: Array<UIMessage> = isClient
    ? toUIMessages(messagesResult.results ?? [])
    : [];

  const send = async () => {
    if (!threadId || !input.trim()) return;
    try {
      await convex.action(api.chat.sendMessage, {
        threadId,
        content: input,
      });
      setInput("");
    } catch (e) {
      console.error("send failed", e);
    }
  };

  const isLoading = messages.some((m) =>
    m.parts.some(
      (p) =>
        (p as { streaming?: boolean }).streaming ||
        (p as { state?: string }).state === "input-streaming",
    ),
  );

  if (!isClient) {
    return (
      <div className="h-full flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title ?? "Agent"}</h3>
          <div className="flex items-center gap-2">
            <VariantSelector value={variant} onChange={setVariant} />
            <Button size="sm" disabled>
              New
            </Button>
          </div>
        </div>
        <Card className="flex-1 overflow-hidden">
          <div className="p-4 text-center text-slate-500">Loading...</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title ?? "Agent"}</h3>
        <div className="flex items-center gap-2">
          <VariantSelector value={variant} onChange={setVariant} />
          <Button size="sm" onClick={() => setThreadId(null)}>
            New
          </Button>
        </div>
      </div>

      <Card className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-2">
          <div className="flex flex-col gap-2">
            {messages.map((m) => (
              <Message key={m.id} message={m} />
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Spinner /> Streaming...
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>

      <div className="flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message and press Enter"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />
        <Button onClick={send}>Send</Button>
      </div>
    </div>
  );
}
