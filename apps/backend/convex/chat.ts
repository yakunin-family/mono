import {
  abortStream,
  getFile,
  listStreams,
  storeFile,
  vStreamArgs,
} from "@convex-dev/agent";
import { generateText, gateway } from "ai";
import { paginationOptsValidator } from "convex/server";
import { ConvexError, v } from "convex/values";

import { components, internal } from "./_generated/api";
import { internalQuery, type ActionCtx } from "./_generated/server";
import { hasDocumentAccess } from "./accessControl";
import { documentEditorAgent } from "./agents/documentEditor";
import { authedAction, authedMutation, authedQuery } from "./functions";

// ============================================
// FILE UPLOAD CONSTANTS
// ============================================

/** Maximum file size in bytes (10MB) */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** Allowed MIME types for file uploads */
const ALLOWED_MIME_TYPES = new Set([
  // Images
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  // Text
  "text/plain",
  "text/markdown",
  "text/csv",
  // Code
  "application/json",
  "application/xml",
  "text/html",
  "text/css",
  "text/javascript",
  "application/javascript",
]);

// ============================================
// FILE UPLOADS
// ============================================

/**
 * Upload a file for use in chat messages.
 * Returns a fileId that can be passed to sendMessage.
 */
export const uploadChatFile = authedAction({
  args: {
    bytes: v.bytes(),
    filename: v.string(),
    mimeType: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate file size
    if (args.bytes.byteLength > MAX_FILE_SIZE) {
      throw new ConvexError(
        `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      );
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.has(args.mimeType)) {
      throw new ConvexError(
        `File type "${args.mimeType}" is not supported. Supported types: images, PDFs, documents, and text files.`,
      );
    }

    // Store the file using the agent component's storeFile helper
    const {
      file: { fileId, storageId },
    } = await storeFile(
      ctx,
      components.agent,
      new Blob([args.bytes], { type: args.mimeType }),
      { filename: args.filename },
    );

    // Get a URL for the file (for preview purposes)
    const url = await ctx.storage.getUrl(storageId);

    return {
      fileId,
      storageId,
      url,
      filename: args.filename,
      mimeType: args.mimeType,
    };
  },
});

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
 * List all threads for a document with preview information.
 * Returns threads sorted by creation time (newest first).
 */
export const listThreadsForDocument = authedQuery({
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

    // Get all threads for this document/user
    const threadLinks = await ctx.db
      .query("documentChatThreads")
      .withIndex("by_document_user", (q) =>
        q.eq("documentId", args.documentId).eq("userId", ctx.user.id),
      )
      .order("desc")
      .collect();

    // Get preview (first user message) for each thread
    const threadsWithPreviews = await Promise.all(
      threadLinks.map(async (link) => {
        // Get the first few messages to find the first user message
        const messages = await documentEditorAgent.listMessages(ctx, {
          threadId: link.threadId,
          paginationOpts: { cursor: null, numItems: 5 },
        });

        // Find first user message for preview
        const firstUserMessage = messages.page.find(
          (m) => m.message?.role === "user",
        );
        const content = firstUserMessage?.message?.content;
        const preview = content
          ? typeof content === "string"
            ? content.slice(0, 100)
            : Array.isArray(content)
              ? content
                  .filter(
                    (p): p is { type: "text"; text: string } =>
                      p.type === "text",
                  )
                  .map((p) => p.text)
                  .join(" ")
                  .slice(0, 100)
              : null
          : null;

        return {
          threadId: link.threadId,
          documentId: link.documentId,
          createdAt: link.createdAt,
          preview,
          messageCount: messages.page.length,
        };
      }),
    );

    return threadsWithPreviews;
  },
});

/**
 * Delete a thread and its link to the document.
 */
export const deleteThread = authedMutation({
  args: {
    threadId: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the thread link
    const threadLink = await ctx.db
      .query("documentChatThreads")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .unique();

    if (!threadLink) {
      throw new ConvexError("Thread not found");
    }

    if (threadLink.userId !== ctx.user.id) {
      throw new ConvexError("Not authorized to delete this thread");
    }

    // Delete the link from our table
    await ctx.db.delete(threadLink._id);

    // Delete the thread from the agent component (async cleanup)
    await documentEditorAgent.deleteThreadAsync(ctx, {
      threadId: args.threadId,
    });

    return { success: true };
  },
});

/**
 * Cancel an active AI generation for a thread.
 * Aborts all currently streaming messages.
 */
export const cancelGeneration = authedMutation({
  args: {
    threadId: v.string(),
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

    // Get all streaming messages for this thread
    const streams = await listStreams(ctx, components.agent, {
      threadId: args.threadId,
      includeStatuses: ["streaming"],
    });

    // Abort all active streams
    let aborted = 0;
    for (const stream of streams) {
      const success = await abortStream(ctx, components.agent, {
        streamId: stream.streamId,
        reason: "user_cancelled",
      });
      if (success) aborted++;
    }

    return { aborted };
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

/** Validator for file attachments */
const attachmentValidator = v.object({
  fileId: v.string(),
  filename: v.string(),
  mimeType: v.string(),
});

/**
 * Send a message and get AI response with streaming.
 * The frontend should subscribe to the thread's messages to see updates.
 */
export const sendMessage = authedAction({
  args: {
    threadId: v.string(),
    content: v.string(),
    documentXml: v.string(),
    /** Optional file attachments (max 5) */
    attachments: v.optional(v.array(attachmentValidator)),
  },
  handler: async (ctx, args) => {
    // Verify the thread belongs to this user
    const threadLink = await ctx.runQuery(internal.chat.getThreadLinkInternal, {
      threadId: args.threadId,
    });

    if (!threadLink || threadLink.userId !== ctx.user.id) {
      throw new ConvexError("Not authorized to access this thread");
    }

    // Validate attachment count
    if (args.attachments && args.attachments.length > 5) {
      throw new ConvexError("Maximum 5 file attachments allowed per message");
    }

    // Continue the thread with the agent
    const { thread } = await documentEditorAgent.continueThread(ctx, {
      threadId: args.threadId,
      userId: ctx.user.id,
    });

    // Build message content parts using types from getFile return
    const contentParts: Array<
      | { type: "text"; text: string }
      | Awaited<ReturnType<typeof getFile>>["filePart"]
      | NonNullable<Awaited<ReturnType<typeof getFile>>["imagePart"]>
    > = [];
    const fileIds: string[] = [];

    // Add file attachments first (if any)
    if (args.attachments?.length) {
      for (const attachment of args.attachments) {
        const { filePart, imagePart } = await getFile(
          ctx,
          components.agent,
          attachment.fileId,
        );
        // Prefer imagePart for images (better LLM support), otherwise use filePart
        contentParts.push(imagePart ?? filePart);
        fileIds.push(attachment.fileId);
      }
    }

    // Add text content
    contentParts.push({ type: "text", text: args.content });

    // Stream the response with document context
    // Note: stopWhen is configured on the agent (stepCountIs(10)) to allow multi-step tool loops
    const result = await thread.streamText(
      {
        // Include document context in the system message
        system: `Current document XML:\n\n${args.documentXml}`,
        // Use message with content parts instead of simple prompt
        messages: [
          {
            role: "user",
            content: contentParts,
          },
        ],
        // Debug: log each step to understand the agent loop
        onStepFinish: async (step) => {
          console.log(`[DocumentEditor] Step finished:`, {
            finishReason: step.finishReason,
            toolCalls: step.toolCalls?.length ?? 0,
            hasText: !!step.text,
            textPreview: step.text?.slice(0, 100),
          });
        },
      },
      {
        // Save both the prompt and output to the thread
        storageOptions: {
          saveMessages: "promptAndOutput",
        },
        // Enable streaming deltas for real-time updates
        saveStreamDeltas: true,
        // Track file references for potential cleanup
        ...(fileIds.length > 0 ? { metadata: { fileIds } } : {}),
      },
    );

    // Wait for completion
    await result.consumeStream();

    return { success: true };
  },
});

// ============================================
// IMAGE ANALYSIS
// ============================================

/**
 * Analyzes images using a vision-capable model and returns text summaries.
 * Uses gpt-4o-mini for cost efficiency — returns text only, not raw images.
 */
async function analyzeImagesWithVision(
  ctx: ActionCtx,
  storageIds: string[],
): Promise<string[]> {
  const imageUrls: string[] = [];
  for (const storageId of storageIds) {
    const url = await ctx.storage.getUrl(storageId);
    if (url) {
      imageUrls.push(url);
    }
  }

  if (imageUrls.length === 0) {
    return [];
  }

  const { text } = await generateText({
    model: gateway("openai/gpt-4o-mini"),
    messages: [
      {
        role: "user",
        content: [
          ...imageUrls.map((url) => ({
            type: "image" as const,
            image: url,
          })),
          {
            type: "text" as const,
            text: "Describe what you see in each image. Be concise and factual. If there are multiple images, number each description.",
          },
        ],
      },
    ],
  });

  return [text];
}

/**
 * Resolve an image analysis request (approve or deny).
 * When approved: analyzes images with vision model, saves result, resumes AI.
 * When denied: saves rejection, AI waits for user's next message.
 */
export const resolveImageAnalysis = authedAction({
  args: {
    threadId: v.string(),
    toolCallId: v.string(),
    messageId: v.string(),
    approved: v.boolean(),
    storageIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify thread ownership
    const threadLink = await ctx.runQuery(internal.chat.getThreadLinkInternal, {
      threadId: args.threadId,
    });

    if (!threadLink || threadLink.userId !== ctx.user.id) {
      throw new ConvexError("Not authorized to access this thread");
    }

    let result: string;

    if (args.approved) {
      // Analyze images with vision model
      const summaries = await analyzeImagesWithVision(ctx, args.storageIds);
      result = JSON.stringify({ summaries });
    } else {
      result = "User declined image analysis";
    }

    // Save tool result to thread
    await documentEditorAgent.saveMessage(ctx, {
      threadId: args.threadId,
      message: {
        role: "tool",
        content: [
          {
            type: "tool-result",
            result,
            toolCallId: args.toolCallId,
            toolName: "analyzeImages",
          },
        ],
      },
    });

    // Resume AI generation only if approved
    if (args.approved) {
      const { thread } = await documentEditorAgent.continueThread(ctx, {
        threadId: args.threadId,
        userId: ctx.user.id,
      });

      await thread.streamText(
        { promptMessageId: args.messageId },
        {
          storageOptions: { saveMessages: "promptAndOutput" },
          saveStreamDeltas: true,
        },
      );
    }

    return { success: true, approved: args.approved };
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
