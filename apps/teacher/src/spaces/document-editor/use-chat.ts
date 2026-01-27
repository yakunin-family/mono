import { api, type Id } from "@app/backend";
import {
  toUIMessages,
  type UIMessage,
  useThreadMessages,
} from "@convex-dev/agent/react";
import {
  type Editor,
  toXML,
  type DocumentOperation,
  type OperationResult,
} from "@package/editor";
import { useMutation } from "@tanstack/react-query";
import { useConvex } from "convex/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  useAIDocumentEdit,
  type ApplyAIResponseResult,
} from "./use-ai-document-edit";
import type { UploadedFile } from "./use-file-upload";

export type { ApplyAIResponseResult, UploadedFile };

/**
 * Optimistic message stored locally while waiting for backend confirmation.
 */
interface OptimisticMessage {
  id: string;
  content: string;
  timestamp: number;
}

/**
 * Creates an optimistic UIMessage for immediate display while waiting for backend.
 * Uses high order/stepOrder values to ensure it appears at the end of the list.
 */
function createOptimisticUIMessage(
  optimistic: OptimisticMessage,
  threadId: string,
): UIMessage {
  return {
    id: optimistic.id,
    role: "user",
    parts: [{ type: "text", text: optimistic.content }],
    // Required UIMessage fields from @convex-dev/agent
    key: `${threadId}-optimistic-${optimistic.id}`,
    order: Number.MAX_SAFE_INTEGER, // Ensure it appears at the end
    stepOrder: 0,
    status: "pending",
    text: optimistic.content,
  };
}

interface UseChatOptions {
  documentId: string;
  editor: Editor | null;
  threadId: string | null;
}

/**
 * Result of applying operations for a specific message.
 * Maps message ID to the results of each operation.
 */
export type OperationResultsMap = Map<string, OperationResult[]>;

/**
 * Result of applying a full document edit (editDocument tool).
 * Maps message ID to the result.
 */
export type EditResultsMap = Map<string, ApplyAIResponseResult>;

interface UseChatReturn {
  messages: UIMessage[];
  operationResults: OperationResultsMap;
  editResults: EditResultsMap;
  isLoading: boolean;
  isSending: boolean;
  sendMessage: (content: string, attachments?: UploadedFile[]) => void;
  sendFirstMessage: (
    content: string,
    attachments?: UploadedFile[],
  ) => Promise<string>;
  cancelGeneration: () => void;
}

/**
 * Hook for managing chat with AI document editing backend using Convex Agent.
 * Accepts a threadId prop - when null, sendFirstMessage must be used to create
 * a new thread. This enables lazy thread creation (only when user sends a message).
 */
export function useChat({
  documentId,
  editor,
  threadId,
}: UseChatOptions): UseChatReturn {
  const convex = useConvex();
  const { applyAIResponse, applyDocumentOperations } =
    useAIDocumentEdit(editor);

  const [isSending, setIsSending] = useState(false);

  // Track optimistic messages for immediate UI feedback
  const [optimisticMessages, setOptimisticMessages] = useState<
    OptimisticMessage[]
  >([]);

  // Track operation results per message (for patchDocument)
  const [operationResults, setOperationResults] = useState<OperationResultsMap>(
    () => new Map(),
  );

  // Track edit results per message (for editDocument)
  const [editResults, setEditResults] = useState<EditResultsMap>(
    () => new Map(),
  );

  // Track which messages we've already applied to avoid re-applying on re-renders
  const appliedMessageIds = useRef<Set<string>>(new Set());

  // Use the agent library's useThreadMessages hook with streaming support
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const messagesResult = useThreadMessages(
    api.chat.listThreadMessages as any,
    threadId ? { threadId } : "skip",
    { initialNumItems: 50, stream: true },
  );

  // Transform to UIMessage format using the library's helper
  const serverMessages = toUIMessages(messagesResult.results ?? []);

  // Merge server messages with optimistic messages, removing optimistic ones
  // that have been confirmed (i.e., a server message with matching content exists)
  const messages = useMemo(() => {
    // If no optimistic messages, just return server messages
    if (optimisticMessages.length === 0) {
      return serverMessages;
    }

    // Find optimistic messages that haven't been confirmed yet
    // We match by content since the server generates new IDs
    const serverUserTexts = new Set(
      serverMessages.filter((m) => m.role === "user").map((m) => m.text.trim()),
    );

    const pendingOptimistic = optimisticMessages.filter(
      (opt) => !serverUserTexts.has(opt.content.trim()),
    );

    // If all optimistic messages have been confirmed, clear them
    if (pendingOptimistic.length === 0 && optimisticMessages.length > 0) {
      // Use setTimeout to avoid state update during render
      setTimeout(() => setOptimisticMessages([]), 0);
      return serverMessages;
    }

    // Convert pending optimistic messages to UIMessage format and append
    // Use a placeholder threadId for first message case (before thread is created)
    const effectiveThreadId = threadId ?? "pending-thread";
    const optimisticUIMessages = pendingOptimistic.map((opt) =>
      createOptimisticUIMessage(opt, effectiveThreadId),
    );

    return [...serverMessages, ...optimisticUIMessages];
  }, [serverMessages, optimisticMessages, threadId]);

  // Apply document changes from assistant messages when they arrive
  useEffect(() => {
    if (!editor || !messages.length) return;

    // Find assistant messages with tool results that we haven't applied yet
    for (const message of messages) {
      if (message.role !== "assistant") continue;
      if (appliedMessageIds.current.has(message.id)) continue;

      // Look for document editing tool results in the message parts
      for (const part of message.parts) {
        // Check if output is ready
        if (!("state" in part) || part.state !== "output-available") continue;

        // Handle editDocument tool (full XML replacement)
        const isEditDocumentTool =
          part.type === "tool-editDocument" ||
          (part.type === "dynamic-tool" && part.toolName === "editDocument");

        if (isEditDocumentTool) {
          const output = part.output as
            | {
                success: boolean;
                documentXml?: string;
                summary?: string;
                error?: string;
              }
            | undefined;

          if (!output?.documentXml) continue;

          // Mark as applied before attempting (to avoid double-application)
          appliedMessageIds.current.add(message.id);

          // Apply the document XML
          const result = applyAIResponse(output.documentXml);

          // Store the result for UI display
          setEditResults((prev) => new Map(prev).set(message.id, result));

          if (!result.success) {
            console.error("Failed to apply editDocument:", result.error);
          }
          break;
        }

        // Handle patchDocument tool (surgical operations)
        const isPatchDocumentTool =
          part.type === "tool-patchDocument" ||
          (part.type === "dynamic-tool" && part.toolName === "patchDocument");

        if (isPatchDocumentTool) {
          const output = part.output as
            | {
                success: boolean;
                operationsJson?: string;
                summary?: string;
                error?: string;
              }
            | undefined;

          if (!output?.operationsJson) continue;

          // Parse operations from JSON string (stored this way to avoid Convex nesting limits)
          let operations: DocumentOperation[];
          try {
            operations = JSON.parse(
              output.operationsJson,
            ) as DocumentOperation[];
          } catch {
            console.error(
              "Failed to parse operationsJson:",
              output.operationsJson,
            );
            continue;
          }

          if (operations.length === 0) continue;

          // Mark as applied before attempting (to avoid double-application)
          appliedMessageIds.current.add(message.id);

          // Apply the operations
          const result = applyDocumentOperations(operations);

          // Store the results for UI display
          setOperationResults((prev) =>
            new Map(prev).set(message.id, result.results),
          );

          if (!result.success) {
            console.error(
              `patchDocument: ${result.failedCount} operations failed`,
            );
          }
          break;
        }
      }
    }
  }, [messages, editor, applyAIResponse, applyDocumentOperations]);

  // Track loading state based on streaming messages or pending tool calls
  const isLoading =
    isSending ||
    messages.some((m) =>
      m.parts.some(
        (p) =>
          (p.type.startsWith("tool-") &&
            "state" in p &&
            (p.state === "input-streaming" || p.state === "input-available")) ||
          (p.type === "text" && "streaming" in p),
      ),
    );

  // Send message to existing thread
  const sendMessageMutation = useMutation({
    mutationFn: async ({
      content,
      attachments,
    }: {
      content: string;
      attachments?: UploadedFile[];
    }) => {
      if (!threadId || !editor) {
        throw new Error("Thread or editor not ready");
      }

      // Get current document as XML
      const documentXml = toXML(editor);

      return await convex.action(api.chat.sendMessage, {
        threadId,
        content,
        documentXml,
        attachments,
      });
    },
    onMutate: ({ content }) => {
      setIsSending(true);
      // Add optimistic message for immediate UI feedback
      const optimisticMessage: OptimisticMessage = {
        id: `optimistic-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        content,
        timestamp: Date.now(),
      };
      setOptimisticMessages((prev) => [...prev, optimisticMessage]);
    },
    onSettled: () => {
      setIsSending(false);
    },
  });

  // Create a new thread and send the first message
  const createAndSendMutation = useMutation({
    mutationFn: async ({
      content,
      attachments,
    }: {
      content: string;
      attachments?: UploadedFile[];
    }) => {
      if (!editor) {
        throw new Error("Editor not ready");
      }

      // Create a new thread first
      const { threadId: newThreadId } = await convex.mutation(
        api.chat.createThread,
        {
          documentId: documentId as Id<"document">,
        },
      );

      // Get current document as XML
      const documentXml = toXML(editor);

      // Send the message to the new thread
      await convex.action(api.chat.sendMessage, {
        threadId: newThreadId,
        content,
        documentXml,
        attachments,
      });

      return newThreadId;
    },
    onMutate: ({ content }) => {
      setIsSending(true);
      // Add optimistic message for immediate UI feedback
      // Note: For first message, threadId is null, but the optimistic message
      // will be cleared when the real message arrives after thread creation
      const optimisticMessage: OptimisticMessage = {
        id: `optimistic-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        content,
        timestamp: Date.now(),
      };
      setOptimisticMessages((prev) => [...prev, optimisticMessage]);
    },
    onSettled: () => {
      setIsSending(false);
    },
  });

  const sendMessage = useCallback(
    (content: string, attachments?: UploadedFile[]) => {
      if (!threadId || !editor) return;
      sendMessageMutation.mutate({ content, attachments });
    },
    [threadId, editor, sendMessageMutation],
  );

  const sendFirstMessage = useCallback(
    async (content: string, attachments?: UploadedFile[]): Promise<string> => {
      if (!editor) {
        throw new Error("Editor not ready");
      }
      return await createAndSendMutation.mutateAsync({ content, attachments });
    },
    [editor, createAndSendMutation],
  );

  // Cancel active AI generation
  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!threadId) return;
      return await convex.mutation(api.chat.cancelGeneration, { threadId });
    },
  });

  const cancelGeneration = useCallback(() => {
    if (!threadId) return;
    cancelMutation.mutate();
  }, [threadId, cancelMutation]);

  return {
    messages,
    operationResults,
    editResults,
    isLoading,
    isSending,
    sendMessage,
    sendFirstMessage,
    cancelGeneration,
  };
}

// Re-export UIMessage type for consumers
export type { UIMessage };
