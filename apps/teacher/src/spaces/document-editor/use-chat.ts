import { api, type Id } from "@app/backend";
import { type Editor, toXML } from "@package/editor";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useConvex } from "convex/react";
import { useCallback, useEffect, useRef, useState } from "react";

import type { Message } from "./chat-messages";
import { useAIDocumentEdit } from "./use-ai-document-edit";

export interface ChatSession {
  _id: Id<"chatSessions">;
  createdAt: number;
  updatedAt: number;
}

interface UseChatOptions {
  documentId: string;
  editor: Editor | null;
}

interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  sendMessage: (content: string) => void;
  sessionId: Id<"chatSessions"> | null;
  sessions: ChatSession[];
  switchSession: (sessionId: Id<"chatSessions">) => void;
}

/**
 * Hook for managing chat with AI document editing backend
 * Creates a new session on every mount (page refresh) and allows switching between sessions
 */
export function useChat({ documentId, editor }: UseChatOptions): UseChatReturn {
  const convex = useConvex();
  const queryClient = useQueryClient();
  const { applyAIResponse } = useAIDocumentEdit(editor);

  const [sessionId, setSessionId] = useState<Id<"chatSessions"> | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Track which messages we've already applied to avoid re-applying on re-renders
  const appliedMessageIds = useRef<Set<string>>(new Set());

  // Track if we've created a session for this mount
  const sessionCreatedRef = useRef(false);

  // Fetch all sessions for this document
  const sessionsQuery = useQuery({
    queryKey: ["chatSessions", documentId],
    queryFn: async () => {
      const sessions = await convex.query(api.chat.getSessionsForDocument, {
        documentId: documentId as Id<"document">,
      });
      return sessions;
    },
    enabled: !!documentId,
  });

  // Create a new session on mount
  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const result = await convex.mutation(api.chat.createSession, {
        documentId: documentId as Id<"document">,
      });
      return result;
    },
    onSuccess: (data) => {
      setSessionId(data.sessionId);
      // Invalidate sessions query to include the new session
      queryClient.invalidateQueries({ queryKey: ["chatSessions", documentId] });
    },
  });

  // Create a new session on mount (only once per component lifecycle)
  useEffect(() => {
    if (documentId && !sessionCreatedRef.current) {
      sessionCreatedRef.current = true;
      createSessionMutation.mutate();
    }
  }, [documentId]);

  // Switch to a different session
  const switchSession = useCallback((newSessionId: Id<"chatSessions">) => {
    // Clear applied message IDs when switching sessions
    appliedMessageIds.current = new Set();
    setSessionId(newSessionId);
  }, []);

  // Query for messages (real-time subscription via Convex)
  const messagesQuery = useQuery({
    queryKey: ["chatMessages", sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      const messages = await convex.query(api.chat.getSessionMessages, {
        sessionId,
      });
      return messages;
    },
    enabled: !!sessionId,
    // Poll for new messages (Convex will provide real-time updates)
    refetchInterval: 1000,
  });

  // Transform backend messages to frontend Message format
  const messages: Message[] =
    messagesQuery.data?.map((msg) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp,
      status: msg.error ? ("error" as const) : ("sent" as const),
      documentXml: msg.documentXml,
      error: msg.error,
    })) ?? [];

  // Apply document XML from assistant messages when they arrive
  useEffect(() => {
    if (!editor || !messages.length) return;

    // Find assistant messages with documentXml that we haven't applied yet
    for (const message of messages) {
      if (
        message.role === "assistant" &&
        message.documentXml &&
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

        // Stop loading indicator when we receive a response
        setIsLoading(false);
      }
    }
  }, [messages, editor, applyAIResponse]);

  // Also stop loading if we see an error message
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === "assistant") {
      setIsLoading(false);
    }
  }, [messages]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!sessionId || !editor) {
        throw new Error("Session or editor not ready");
      }

      // Get current document as XML
      const documentXml = toXML(editor);

      return await convex.mutation(api.chat.sendMessage, {
        sessionId,
        content,
        documentXml,
      });
    },
    onSuccess: () => {
      // Invalidate messages query to fetch the new message
      queryClient.invalidateQueries({ queryKey: ["chatMessages", sessionId] });
    },
  });

  const sendMessage = useCallback(
    (content: string) => {
      if (!sessionId || !editor) return;

      setIsLoading(true);
      sendMessageMutation.mutate(content);
    },
    [sessionId, editor, sendMessageMutation],
  );

  const sessions: ChatSession[] =
    sessionsQuery.data?.map((s) => ({
      _id: s._id,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    })) ?? [];

  return {
    messages,
    isLoading,
    sendMessage,
    sessionId,
    sessions,
    switchSession,
  };
}
