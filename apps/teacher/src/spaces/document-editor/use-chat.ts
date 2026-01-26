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
import { useCallback, useEffect, useRef, useState } from "react";

import {
  useAIDocumentEdit,
  type ApplyAIResponseResult,
} from "./use-ai-document-edit";
import type { UploadedFile } from "./use-file-upload";

export type { ApplyAIResponseResult, UploadedFile };

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
  const messagesResult = useThreadMessages(
    api.chat.listThreadMessages,
    threadId ? { threadId } : "skip",
    { initialNumItems: 50, stream: true },
  );

  // Transform to UIMessage format using the library's helper
  const messages = toUIMessages(messagesResult.results ?? []);

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
                operations?: DocumentOperation[];
                summary?: string;
                error?: string;
              }
            | undefined;

          if (!output?.operations || output.operations.length === 0) continue;

          // Mark as applied before attempting (to avoid double-application)
          appliedMessageIds.current.add(message.id);

          // Apply the operations
          const result = applyDocumentOperations(output.operations);

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
    onMutate: () => {
      setIsSending(true);
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
    onMutate: () => {
      setIsSending(true);
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
