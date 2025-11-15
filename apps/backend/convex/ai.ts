import { streamText } from "ai";
import { v } from "convex/values";
import invariant from "tiny-invariant";

import { components } from "./_generated/api";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import {
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  MutationCtx,
  query,
  QueryCtx,
} from "./_generated/server";
import { authComponent } from "./auth";

/**
 * Helper function to check if user has access to a document (for mutations)
 * Returns true if user is the owner OR has shared access
 */
async function hasDocumentAccessMutation(
  ctx: MutationCtx,
  documentId: Id<"document">,
  userId: string,
): Promise<boolean> {
  const document = await ctx.db.get(documentId);

  if (!document) {
    return false;
  }

  // Check if user is the owner
  if (document.owner === userId) {
    return true;
  }

  // Check if document is shared with the user
  const share = await ctx.db
    .query("sharedDocuments")
    .withIndex("by_document_and_student", (q) =>
      q.eq("documentId", documentId).eq("studentId", userId),
    )
    .first();

  return share !== null;
}

/**
 * Helper function to check if user has access to a document (for queries)
 */
async function hasDocumentAccessQuery(
  ctx: QueryCtx,
  documentId: Id<"document">,
  userId: string,
): Promise<boolean> {
  const document = await ctx.db.get(documentId);

  if (!document) {
    return false;
  }

  // Check if user is the owner
  if (document.owner === userId) {
    return true;
  }

  // Check if document is shared with the user
  const share = await ctx.db
    .query("sharedDocuments")
    .withIndex("by_document_and_student", (q) =>
      q.eq("documentId", documentId).eq("studentId", userId),
    )
    .first();

  return share !== null;
}

/**
 * Create a new AI generation request
 */
export const createGeneration = mutation({
  args: {
    documentId: v.string(),
    promptText: v.string(),
    model: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    const documentId = args.documentId as Id<"document">;

    // Verify document access
    const hasAccess = await hasDocumentAccessMutation(
      ctx,
      documentId,
      user._id,
    );
    invariant(hasAccess, "Not authorized to access this document");

    // Create stream using persistent-text-streaming component
    const streamId = await ctx.runMutation(
      components.persistentTextStreaming.lib.createStream,
      {},
    );

    // Create AI generation tracking record
    const generationId = await ctx.db.insert("aiGeneration", {
      documentId,
      userId: user._id,
      promptText: args.promptText,
      streamId,
      generatedContent: "",
      model: args.model,
      status: "pending",
      createdAt: Date.now(),
    });

    // Schedule the streaming action to run
    await ctx.scheduler.runAfter(0, internal.ai.streamGeneration, {
      generationId,
    });

    return { generationId, streamId };
  },
});

/**
 * Stream AI response from Vercel AI Gateway
 */
export const streamGeneration = internalAction({
  args: {
    generationId: v.id("aiGeneration"),
  },
  handler: async (ctx, args) => {
    // Get the generation record
    const generation = await ctx.runQuery(internal.ai.getGenerationForAction, {
      generationId: args.generationId,
    });

    invariant(generation, "Generation not found");

    try {
      // Update status to streaming
      await ctx.runMutation(internal.ai.updateGenerationStatus, {
        generationId: args.generationId,
        status: "streaming",
      });

      // Stream from Vercel AI Gateway
      // The gateway automatically uses AI_GATEWAY_API_KEY from environment
      const result = await streamText({
        model: generation.model, // e.g., "openai/gpt-4" or "anthropic/claude-3-5-sonnet"
        prompt: generation.promptText,
      });

      let fullContent = "";

      // Stream and update database on sentence boundaries
      for await (const chunk of result.textStream) {
        fullContent += chunk;

        // Update on sentence boundaries (. ! ?) for performance
        if (/[.!?]\s*$/.test(fullContent)) {
          await ctx.runMutation(internal.ai.updateGenerationContent, {
            generationId: args.generationId,
            content: fullContent,
          });
        }
      }

      // Get final usage
      const usage = await result.usage;

      // Final update with complete content
      await ctx.runMutation(internal.ai.completeGeneration, {
        generationId: args.generationId,
        content: fullContent,
        tokensUsed: usage.totalTokens,
      });
    } catch (error) {
      // Mark as failed on error
      await ctx.runMutation(internal.ai.updateGenerationStatus, {
        generationId: args.generationId,
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  },
});

/**
 * Get a generation by ID for real-time updates
 */
export const getGeneration = query({
  args: {
    generationId: v.id("aiGeneration"),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    const generation = await ctx.db.get(args.generationId);

    invariant(generation, "Generation not found");

    // Verify document access
    const hasAccess = await hasDocumentAccessQuery(
      ctx,
      generation.documentId,
      user._id,
    );
    invariant(hasAccess, "Not authorized to access this generation");

    return generation;
  },
});

/**
 * Internal query for action to get generation (no auth check)
 */
export const getGenerationForAction = internalQuery({
  args: {
    generationId: v.id("aiGeneration"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.generationId);
  },
});

/**
 * Update generation status
 */
export const updateGenerationStatus = internalMutation({
  args: {
    generationId: v.id("aiGeneration"),
    status: v.union(
      v.literal("pending"),
      v.literal("streaming"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.generationId, {
      status: args.status,
      errorMessage: args.errorMessage,
    });
  },
});

/**
 * Update generation content during streaming
 */
export const updateGenerationContent = internalMutation({
  args: {
    generationId: v.id("aiGeneration"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.generationId, {
      generatedContent: args.content,
    });
  },
});

/**
 * Complete generation and track usage
 */
export const completeGeneration = internalMutation({
  args: {
    generationId: v.id("aiGeneration"),
    content: v.string(),
    tokensUsed: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const generation = await ctx.db.get(args.generationId);
    invariant(generation, "Generation not found");

    // Update generation record
    await ctx.db.patch(args.generationId, {
      generatedContent: args.content,
      tokensUsed: args.tokensUsed,
      status: "completed",
    });

    // Update teacher's token usage
    if (args.tokensUsed) {
      const teacher = await ctx.db
        .query("teacher")
        .withIndex("by_userId", (q) => q.eq("userId", generation.userId))
        .first();

      if (teacher) {
        const currentUsage = teacher.aiTokensUsed || 0;
        await ctx.db.patch(teacher._id, {
          aiTokensUsed: currentUsage + args.tokensUsed,
        });
      }
    }
  },
});

/**
 * Mark generation as accepted by a user
 */
export const markGenerationAccepted = mutation({
  args: {
    generationId: v.id("aiGeneration"),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    const generation = await ctx.db.get(args.generationId);

    invariant(generation, "Generation not found");

    // Verify document access
    const hasAccess = await hasDocumentAccessMutation(
      ctx,
      generation.documentId,
      user._id,
    );
    invariant(hasAccess, "Not authorized to accept this generation");

    // Check if already accepted (database lock)
    invariant(!generation.acceptedBy, "Generation already accepted");

    // Mark as accepted
    await ctx.db.patch(args.generationId, {
      acceptedBy: user._id,
      acceptedAt: Date.now(),
    });
  },
});
