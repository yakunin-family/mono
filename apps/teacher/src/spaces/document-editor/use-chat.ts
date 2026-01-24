import { api, type Id } from "@app/backend";
import { type Editor, toXML } from "@package/editor";
import { useMutation } from "@tanstack/react-query";
import { useConvex, usePaginatedQuery, useQuery } from "convex/react";
import { useCallback, useEffect, useRef, useState } from "react";

import type { Message } from "./chat-messages";
import { useAIDocumentEdit } from "./use-ai-document-edit";

interface UseChatOptions {
  documentId: string;
  editor: Editor | null;
}

interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  isSending: boolean;
  sendMessage: (content: string) => void;
  threadId: string | null;
}

/**
 * Hook for managing chat with AI document editing backend using Convex Agent
 * Creates a new thread on mount and provides real-time updates via Convex subscriptions
 */
export function useChat({ documentId, editor }: UseChatOptions): UseChatReturn {
  const convex = useConvex();
  const { applyAIResponse } = useAIDocumentEdit(editor);

  const [threadId, setThreadId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  // Track which messages we've already applied to avoid re-applying on re-renders
  const appliedMessageIds = useRef<Set<string>>(new Set());

  // Track if we've created a thread for this mount
  const threadCreatedRef = useRef(false);

  // Get existing thread for this document (real-time subscription)
  const existingThread = useQuery(
    api.chat.getThreadForDocument,
    documentId ? { documentId: documentId as Id<"document"> } : "skip",
  );

  // Create a new thread mutation
  const createThreadMutation = useMutation({
    mutationFn: async () => {
      const result = await convex.mutation(api.chat.createThread, {
        documentId: documentId as Id<"document">,
      });
      return result;
    },
    onSuccess: (data) => {
      setThreadId(data.threadId);
    },
  });

  // Create thread on mount if none exists
  useEffect(() => {
    if (!documentId || threadCreatedRef.current) return;

    // If we have an existing thread, use it
    if (existingThread?.threadId) {
      setThreadId(existingThread.threadId);
      return;
    }

    // If query returned null (no thread), create one
    if (existingThread === null) {
      threadCreatedRef.current = true;
      createThreadMutation.mutate();
    }
  }, [documentId, existingThread]);

  // Use Convex's usePaginatedQuery for messages (real-time subscription)
  const messagesResult = usePaginatedQuery(
    api.chat.listThreadMessages,
    threadId ? { threadId } : "skip",
    { initialNumItems: 50 },
  );

  // Transform agent messages to our Message format
  const messages: Message[] = (messagesResult.results ?? []).map((msg) => {
    // Extract text content from message
    let textContent = "";
    let role: "user" | "assistant" = "assistant";
    let documentXml: string | undefined;

    // Parse the message structure from the agent
    if (msg.message && typeof msg.message === "object") {
      const message = msg.message as Record<string, unknown>;

      // Get role
      if ("role" in message && typeof message.role === "string") {
        role = message.role as "user" | "assistant";
      }

      // Get content
      if ("content" in message) {
        const content = message.content;
        if (typeof content === "string") {
          textContent = content;
        } else if (Array.isArray(content)) {
          // Handle structured content (text parts, tool calls, etc.)
          for (const part of content) {
            if (part && typeof part === "object") {
              const p = part as Record<string, unknown>;
              // Text part
              if (p.type === "text" && typeof p.text === "string") {
                textContent += p.text;
              }
              // Tool result with document edit
              if (
                p.type === "tool-result" &&
                p.toolName === "editDocument" &&
                p.result &&
                typeof p.result === "object"
              ) {
                const result = p.result as Record<string, unknown>;
                if (typeof result.documentXml === "string") {
                  documentXml = result.documentXml;
                }
              }
            }
          }
        }
      }
    }

    // Fallback to text field if available
    if (!textContent && "text" in msg && typeof msg.text === "string") {
      textContent = msg.text;
    }

    // Determine status
    type MsgWithStreaming = typeof msg & { streaming?: boolean };
    const isStreaming = (msg as MsgWithStreaming).streaming === true;
    const hasError = "error" in msg && !!msg.error;

    return {
      id: msg._id,
      role,
      content: textContent,
      timestamp: msg._creationTime,
      status: hasError ? "error" : isStreaming ? "streaming" : "sent",
      documentXml,
      error: hasError ? String(msg.error) : undefined,
    };
  });

  // Apply document XML from assistant messages when they arrive
  useEffect(() => {
    if (!editor || !messages.length) return;

    // Find assistant messages with documentXml that we haven't applied yet
    for (const message of messages) {
      if (
        message.role === "assistant" &&
        message.documentXml &&
        message.status === "sent" && // Only apply completed messages
        !message.error &&
        !appliedMessageIds.current.has(message.id)
      ) {
        // Mark as applied before attempting (to avoid double-application)
        appliedMessageIds.current.add(message.id);

        // Apply the document XML
        const result = applyAIResponse(message.documentXml);
        if (!result.success) {
          console.error("Failed to apply AI response:", result.error);
        }
      }
    }
  }, [messages, editor, applyAIResponse]);

  // Track loading state based on streaming messages
  const isLoading = isSending || messages.some((m) => m.status === "streaming");

  // Send message using action
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!threadId || !editor) {
        throw new Error("Thread or editor not ready");
      }

      // Get current document as XML
      const documentXml = toXML(editor);

      return await convex.action(api.chat.sendMessage, {
        threadId,
        content,
        documentXml,
      });
    },
    onMutate: () => {
      setIsSending(true);
    },
    onSettled: () => {
      setIsSending(false);
    },
  });

  const sendMessage = useCallback(
    (content: string) => {
      if (!threadId || !editor) return;
      sendMessageMutation.mutate(content);
    },
    [threadId, editor, sendMessageMutation],
  );

  return {
    messages,
    isLoading,
    isSending,
    sendMessage,
    threadId,
  };
}
