import { generateObject } from "ai";
import { ConvexError, v } from "convex/values";

import { internal } from "./_generated/api";
import { internalAction, internalMutation } from "./_generated/server";
import { buildDocumentEditorChatPrompt } from "./_generated_prompts";
import { hasDocumentAccess } from "./accessControl";
import { authedMutation, authedQuery } from "./functions";
import { chatResponseSchema } from "./validators/chat";

/**
 * Maximum number of messages to include in conversation history for AI context
 */
const MAX_CONVERSATION_HISTORY = 20;

/**
 * Default model for document editing chat
 */
const CHAT_MODEL = "anthropic/claude-3-5-sonnet-20241022";

// ============================================
// QUERIES
// ============================================

/**
 * Get all chat sessions for the current user and document, ordered by most recent first
 */
export const getSessionsForDocument = authedQuery({
  args: {
    documentId: v.id("document"),
  },
  handler: async (ctx, args) => {
    // Verify document access
    const hasAccess = await hasDocumentAccess(
      ctx,
      args.documentId,
      ctx.user.id,
    );
    if (!hasAccess) {
      throw new ConvexError("Not authorized to access this document");
    }

    // Find all sessions for this document and user
    const sessions = await ctx.db
      .query("chatSessions")
      .withIndex("by_document_user", (q) =>
        q.eq("documentId", args.documentId).eq("userId", ctx.user.id),
      )
      .collect();

    // Sort by updatedAt descending (most recent first)
    return sessions.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

/**
 * Get all messages for a chat session, ordered by creation time
 * Maps to frontend Message interface
 */
export const getSessionMessages = authedQuery({
  args: {
    sessionId: v.id("chatSessions"),
  },
  handler: async (ctx, args) => {
    // Get session and verify ownership
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new ConvexError("Chat session not found");
    }
    if (session.userId !== ctx.user.id) {
      throw new ConvexError("Not authorized to access this chat session");
    }

    // Get messages ordered by creation time
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_session_created", (q) => q.eq("sessionId", args.sessionId))
      .collect();

    // Map to frontend Message interface
    return messages.map((msg) => ({
      id: msg._id,
      role: msg.role,
      content: msg.content,
      timestamp: msg.createdAt,
      status: msg.error ? ("error" as const) : ("sent" as const),
      documentXml: msg.documentXml,
      error: msg.error,
    }));
  },
});

// ============================================
// MUTATIONS
// ============================================

/**
 * Create a new chat session (always creates a fresh session)
 */
export const createSession = authedMutation({
  args: {
    documentId: v.id("document"),
  },
  handler: async (ctx, args) => {
    // Verify document access
    const hasAccess = await hasDocumentAccess(
      ctx,
      args.documentId,
      ctx.user.id,
    );
    if (!hasAccess) {
      throw new ConvexError("Not authorized to access this document");
    }

    // Create new session
    const now = Date.now();
    const sessionId = await ctx.db.insert("chatSessions", {
      documentId: args.documentId,
      userId: ctx.user.id,
      createdAt: now,
      updatedAt: now,
    });

    return { sessionId };
  },
});

/**
 * Send a user message and trigger AI response
 */
export const sendMessage = authedMutation({
  args: {
    sessionId: v.id("chatSessions"),
    content: v.string(),
    documentXml: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify session ownership
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new ConvexError("Chat session not found");
    }
    if (session.userId !== ctx.user.id) {
      throw new ConvexError("Not authorized to access this chat session");
    }

    const now = Date.now();

    // Insert user message
    const userMessageId = await ctx.db.insert("chatMessages", {
      sessionId: args.sessionId,
      role: "user",
      content: args.content,
      createdAt: now,
    });

    // Update session timestamp
    await ctx.db.patch(args.sessionId, {
      updatedAt: now,
    });

    // Get conversation history for AI context (last N messages before this one)
    const allMessages = await ctx.db
      .query("chatMessages")
      .withIndex("by_session_created", (q) => q.eq("sessionId", args.sessionId))
      .collect();

    // Take last N messages (excluding the one we just inserted)
    const historyMessages = allMessages
      .filter((m) => m._id !== userMessageId)
      .slice(-MAX_CONVERSATION_HISTORY);

    const conversationHistory = historyMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Schedule AI response action
    await ctx.scheduler.runAfter(0, internal.chat.generateResponse, {
      sessionId: args.sessionId,
      userMessageId,
      documentXml: args.documentXml,
      instruction: args.content,
      conversationHistory,
    });

    return { messageId: userMessageId };
  },
});

// ============================================
// INTERNAL MUTATIONS (for AI action to use)
// ============================================

/**
 * Create an assistant message (called by generateResponse action)
 */
export const createAssistantMessage = internalMutation({
  args: {
    sessionId: v.id("chatSessions"),
    content: v.string(),
    documentXml: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Insert assistant message
    const messageId = await ctx.db.insert("chatMessages", {
      sessionId: args.sessionId,
      role: "assistant",
      content: args.content,
      documentXml: args.documentXml,
      error: args.error,
      createdAt: now,
    });

    // Update session timestamp
    await ctx.db.patch(args.sessionId, {
      updatedAt: now,
    });

    return { messageId };
  },
});

// ============================================
// INTERNAL ACTIONS (AI integration)
// ============================================

/**
 * Generate AI response for a user message
 * Calls LLM with document context and stores the response
 */
export const generateResponse = internalAction({
  args: {
    sessionId: v.id("chatSessions"),
    userMessageId: v.id("chatMessages"),
    documentXml: v.string(),
    instruction: v.string(),
    conversationHistory: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    try {
      // Format conversation history for prompt
      const historyText =
        args.conversationHistory.length > 0
          ? args.conversationHistory
              .map(
                (m) =>
                  `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`,
              )
              .join("\n\n")
          : "No previous messages.";

      // Build prompt
      const promptText = buildDocumentEditorChatPrompt({
        documentXml: args.documentXml,
        conversationHistory: historyText,
        instruction: args.instruction,
      });

      // Call LLM with structured output
      const result = await generateObject({
        model: CHAT_MODEL,
        schema: chatResponseSchema,
        prompt: promptText,
      });

      const response = result.object;

      // Basic XML validation: check it's wrapped in <lesson> tags
      const xmlTrimmed = response.documentXml.trim();
      if (
        !xmlTrimmed.startsWith("<lesson>") ||
        !xmlTrimmed.endsWith("</lesson>")
      ) {
        throw new Error(
          "Invalid XML response: document must be wrapped in <lesson> tags",
        );
      }

      // Store assistant message with the new document XML
      await ctx.runMutation(internal.chat.createAssistantMessage, {
        sessionId: args.sessionId,
        content: response.explanation,
        documentXml: response.documentXml,
        error: undefined,
      });
    } catch (error) {
      // Store error in assistant message
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

      await ctx.runMutation(internal.chat.createAssistantMessage, {
        sessionId: args.sessionId,
        content: `I encountered an error while processing your request: ${errorMessage}`,
        documentXml: undefined,
        error: errorMessage,
      });
    }
  },
});
