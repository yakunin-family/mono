/**
 * Langfuse integration for observability and tracing of AI calls.
 *
 * This module provides handlers that can be attached to the Convex Agent
 * to automatically trace all LLM calls to Langfuse.
 */
import type {
  RawRequestResponseHandler,
  UsageHandler,
} from "@convex-dev/agent";
import { Langfuse } from "langfuse";

// ============================================
// LANGFUSE CLIENT
// ============================================

/**
 * Create a Langfuse client instance.
 * Uses environment variables for configuration.
 */
function createLangfuseClient(): Langfuse {
  const secretKey = process.env.LANGFUSE_SECRET_KEY;
  const publicKey = process.env.LANGFUSE_PUBLIC_KEY;
  const baseUrl = process.env.LANGFUSE_BASE_URL;

  if (!secretKey || !publicKey) {
    console.warn(
      "[Langfuse] Missing LANGFUSE_SECRET_KEY or LANGFUSE_PUBLIC_KEY. Tracing disabled.",
    );
  }

  return new Langfuse({
    secretKey: secretKey ?? "",
    publicKey: publicKey ?? "",
    baseUrl: baseUrl ?? "https://cloud.langfuse.com",
    // Flush events immediately in serverless environment
    flushAt: 1,
    flushInterval: 0,
  });
}

// ============================================
// TRACE MANAGEMENT
// ============================================

/**
 * In-memory cache to track active traces by threadId.
 * This allows us to group all LLM calls within a conversation into a single trace.
 *
 * Note: In serverless, each action invocation is isolated, so we create
 * one trace per action call (which typically corresponds to one user message).
 */
const activeTraces = new Map<
  string,
  { traceId: string; langfuse: Langfuse; stepCount: number }
>();

/**
 * Get or create a trace for a thread.
 * All LLM calls within the same action invocation will be grouped under this trace.
 */
function getOrCreateTrace(
  threadId: string | undefined,
  userId: string | undefined,
  agentName: string | undefined,
): { traceId: string; langfuse: Langfuse; stepCount: number } {
  const cacheKey = threadId ?? `anonymous-${Date.now()}`;

  let traceInfo = activeTraces.get(cacheKey);
  if (!traceInfo) {
    const langfuse = createLangfuseClient();
    const trace = langfuse.trace({
      name: agentName ?? "document-editor",
      userId: userId,
      sessionId: threadId,
      metadata: {
        threadId,
        agentName,
      },
    });

    traceInfo = {
      traceId: trace.id,
      langfuse,
      stepCount: 0,
    };
    activeTraces.set(cacheKey, traceInfo);
  }

  return traceInfo;
}

// ============================================
// AGENT HANDLERS
// ============================================

/**
 * Usage handler for tracking token consumption.
 * Called after every LLM call with token counts and model info.
 */
export const langfuseUsageHandler: UsageHandler = async (_ctx, args) => {
  const { threadId, userId, agentName, usage, model, provider } = args;

  const traceInfo = getOrCreateTrace(threadId, userId, agentName);
  traceInfo.stepCount++;

  try {
    // Create a generation span for this LLM call
    traceInfo.langfuse.generation({
      traceId: traceInfo.traceId,
      name: `${agentName ?? "llm"}-step-${traceInfo.stepCount}`,
      model: model,
      modelParameters: {
        provider,
      },
      usage: {
        input: usage.inputTokens,
        output: usage.outputTokens,
        total: usage.totalTokens,
      },
      metadata: {
        reasoningTokens: usage.reasoningTokens,
        cachedInputTokens: usage.cachedInputTokens,
        stepNumber: traceInfo.stepCount,
      },
    });

    // Flush immediately in serverless environment
    await traceInfo.langfuse.flushAsync();
  } catch (error) {
    console.error("[Langfuse] Failed to log usage:", error);
  }
};

/**
 * Raw request/response handler for logging full LLM interactions.
 * Called after every LLM call with the complete request and response.
 */
export const langfuseRawRequestResponseHandler: RawRequestResponseHandler =
  async (_ctx, args) => {
    const { threadId, userId, agentName, request, response } = args;

    const traceInfo = getOrCreateTrace(threadId, userId, agentName);

    try {
      // Extract messages from request body for better visibility
      const requestBody =
        typeof request.body === "string"
          ? JSON.parse(request.body)
          : request.body;

      const messages = requestBody?.messages ?? [];
      const tools = requestBody?.tools ?? [];

      // Create a generation with full request/response details
      traceInfo.langfuse.generation({
        traceId: traceInfo.traceId,
        name: `${agentName ?? "llm"}-generation-${traceInfo.stepCount}`,
        model: response.modelId,
        input: {
          messages: messages,
          tools: tools.length > 0 ? tools : undefined,
        },
        output: response,
        metadata: {
          requestId: response.id,
          timestamp: response.timestamp,
          responseHeaders: response.headers,
          stepNumber: traceInfo.stepCount,
        },
      });

      // Flush immediately
      await traceInfo.langfuse.flushAsync();
    } catch (error) {
      console.error("[Langfuse] Failed to log request/response:", error);
    }
  };

/**
 * Cleanup function to flush all pending traces.
 * Call this at the end of an action if you want to ensure all traces are sent.
 */
export async function flushLangfuseTraces(): Promise<void> {
  const flushPromises: Promise<void>[] = [];
  const keys = Array.from(activeTraces.keys());

  for (const key of keys) {
    const traceInfo = activeTraces.get(key);
    if (traceInfo) {
      flushPromises.push(
        traceInfo.langfuse.flushAsync().then(() => {
          activeTraces.delete(key);
        }),
      );
    }
  }

  await Promise.all(flushPromises);
}

/**
 * Shutdown Langfuse client gracefully.
 * Call this when the application is shutting down.
 */
export async function shutdownLangfuse(): Promise<void> {
  const entries = Array.from(activeTraces.values());
  for (const traceInfo of entries) {
    await traceInfo.langfuse.shutdownAsync();
  }
  activeTraces.clear();
}
