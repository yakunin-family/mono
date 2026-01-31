import { abortStream, listStreams, vStreamArgs } from "@convex-dev/agent";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import {
  MutationCtx,
  QueryCtx,
  action,
  mutation,
  query,
} from "./_generated/server";

import { components } from "./_generated/api";
import { documentEditorAgent } from "./agents/documentEditor";

/**
 * Create a new chat thread.
 */
export const createThread = mutation({
  args: {},
  handler: async (ctx: MutationCtx) => {
    const { threadId } = await documentEditorAgent.createThread(ctx, {});
    return { threadId };
  },
});

/**
 * List messages for a thread with pagination and optional streaming.
 * Compatible with useThreadMessages hook from @convex-dev/agent/react.
 */
export const listThreadMessages = query({
  args: {
    threadId: v.string(),
    paginationOpts: paginationOptsValidator,
    streamArgs: v.optional(vStreamArgs),
  },
  handler: async (ctx: QueryCtx, args) => {
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
 * Send a message and get AI response with streaming.
 */
export const sendMessage = action({
  args: {
    threadId: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const { thread } = await documentEditorAgent.continueThread(ctx, {
      threadId: args.threadId,
    });

    const result = await thread.streamText(
      {
        prompt: args.content,
      },
      {
        storageOptions: {
          saveMessages: "promptAndOutput",
        },
        saveStreamDeltas: true,
      },
    );

    await result.consumeStream();

    return { success: true };
  },
});

/**
 * Cancel an active AI generation for a thread.
 */
export const cancelGeneration = mutation({
  args: {
    threadId: v.string(),
  },
  handler: async (ctx: MutationCtx, args) => {
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
