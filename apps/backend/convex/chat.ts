import { vStreamArgs } from "@convex-dev/agent";
import { paginationOptsValidator } from "convex/server";
import { ConvexError, v } from "convex/values";

import { internal } from "./_generated/api";
import { internalQuery } from "./_generated/server";
import { hasDocumentAccess } from "./accessControl";
import { documentEditorAgent } from "./agents/documentEditor";
import { authedAction, authedMutation, authedQuery } from "./functions";

// ============================================
// THREAD MANAGEMENT
// ============================================

/**
 * Create a new chat thread for a document.
 * Links the thread to the document via our documentChatThreads table.
 */
export const createThread = authedMutation({
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

    // Create thread using the agent
    const { threadId } = await documentEditorAgent.createThread(ctx, {
      userId: ctx.user.id,
    });

    // Link thread to document
    await ctx.db.insert("documentChatThreads", {
      documentId: args.documentId,
      threadId,
      userId: ctx.user.id,
      createdAt: Date.now(),
    });

    return { threadId };
  },
});

/**
 * Get the current thread for a document.
 * Returns the most recent thread for this user/document combination.
 */
export const getThreadForDocument = authedQuery({
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

    // Find the most recent thread for this document/user
    const threads = await ctx.db
      .query("documentChatThreads")
      .withIndex("by_document_user", (q) =>
        q.eq("documentId", args.documentId).eq("userId", ctx.user.id),
      )
      .order("desc")
      .take(1);

    return threads[0] ?? null;
  },
});

/**
 * List messages for a thread with pagination and optional streaming.
 * Uses the agent's built-in message storage.
 * Compatible with useThreadMessages hook from @convex-dev/agent/react.
 */
export const listThreadMessages = authedQuery({
  args: {
    threadId: v.string(),
    paginationOpts: paginationOptsValidator,
    streamArgs: v.optional(vStreamArgs),
  },
  handler: async (ctx, args) => {
    // Verify the thread belongs to this user
    const threadLink = await ctx.db
      .query("documentChatThreads")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .unique();

    if (!threadLink || threadLink.userId !== ctx.user.id) {
      throw new ConvexError("Not authorized to access this thread");
    }

    // Get paginated messages
    const paginated = await documentEditorAgent.listMessages(ctx, {
      threadId: args.threadId,
      paginationOpts: args.paginationOpts,
    });

    // Get streaming deltas if streamArgs provided
    const streams = args.streamArgs
      ? await documentEditorAgent.syncStreams(ctx, {
          threadId: args.threadId,
          streamArgs: args.streamArgs,
        })
      : undefined;

    return { ...paginated, streams };
  },
});

/**
 * @deprecated Use listThreadMessages instead
 */
export const listMessages = authedQuery({
  args: {
    threadId: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    // Verify the thread belongs to this user
    const threadLink = await ctx.db
      .query("documentChatThreads")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .unique();

    if (!threadLink || threadLink.userId !== ctx.user.id) {
      throw new ConvexError("Not authorized to access this thread");
    }

    // Use the agent's listMessages
    return documentEditorAgent.listMessages(ctx, {
      threadId: args.threadId,
      paginationOpts: args.paginationOpts,
    });
  },
});

// ============================================
// MESSAGE SENDING
// ============================================

/**
 * Send a message and get AI response with streaming.
 * The frontend should subscribe to the thread's messages to see updates.
 */
export const sendMessage = authedAction({
  args: {
    threadId: v.string(),
    content: v.string(),
    documentXml: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify the thread belongs to this user
    const threadLink = await ctx.runQuery(internal.chat.getThreadLinkInternal, {
      threadId: args.threadId,
    });

    if (!threadLink || threadLink.userId !== ctx.user.id) {
      throw new ConvexError("Not authorized to access this thread");
    }

    // Continue the thread with the agent
    const { thread } = await documentEditorAgent.continueThread(ctx, {
      threadId: args.threadId,
      userId: ctx.user.id,
    });

    // Stream the response with document context
    const result = await thread.streamText(
      {
        // Include document context in the system message
        system: `Current document XML:\n\n${args.documentXml}`,
        prompt: args.content,
      },
      {
        // Save both the prompt and output to the thread
        storageOptions: {
          saveMessages: "promptAndOutput",
        },
        // Enable streaming deltas for real-time updates
        saveStreamDeltas: true,
      },
    );

    // Wait for completion
    await result.consumeStream();

    return { success: true };
  },
});

// ============================================
// INTERNAL QUERIES
// ============================================

/**
 * Internal query to get thread link (for use in actions)
 */
export const getThreadLinkInternal = internalQuery({
  args: {
    threadId: v.string(),
  },
  handler: async (ctx, args) => {
    return ctx.db
      .query("documentChatThreads")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .unique();
  },
});

// ============================================
// STREAMING SUPPORT
// ============================================

/**
 * Sync stream deltas for real-time message updates.
 * The frontend uses this to subscribe to streaming updates.
 */
export const syncStreamDeltas = authedQuery({
  args: {
    threadId: v.string(),
    streamArgs: v.optional(vStreamArgs),
  },
  handler: async (ctx, args) => {
    // Verify the thread belongs to this user
    const threadLink = await ctx.db
      .query("documentChatThreads")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .unique();

    if (!threadLink || threadLink.userId !== ctx.user.id) {
      throw new ConvexError("Not authorized to access this thread");
    }

    // Get stream deltas using the agent's syncStreams
    return documentEditorAgent.syncStreams(ctx, {
      threadId: args.threadId,
      streamArgs: args.streamArgs,
    });
  },
});

// ============================================
// DEPRECATED: Old session-based API
// These are kept for backward compatibility during migration
// ============================================

/**
 * @deprecated Use getThreadForDocument instead
 */
export const getSessionsForDocument = authedQuery({
  args: {
    documentId: v.id("document"),
  },
  handler: async () => {
    // Return empty array - old sessions are deprecated
    return [];
  },
});

/**
 * @deprecated Use listMessages instead
 */
export const getSessionMessages = authedQuery({
  args: {
    sessionId: v.id("chatSessions"),
  },
  handler: async () => {
    // Return empty array - old sessions are deprecated
    return [];
  },
});

/**
 * @deprecated Use createThread instead
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

    // Create thread using the agent
    const { threadId } = await documentEditorAgent.createThread(ctx, {
      userId: ctx.user.id,
    });

    // Link thread to document
    await ctx.db.insert("documentChatThreads", {
      documentId: args.documentId,
      threadId,
      userId: ctx.user.id,
      createdAt: Date.now(),
    });

    // Return in old format for backward compatibility
    return { sessionId: threadId };
  },
});
