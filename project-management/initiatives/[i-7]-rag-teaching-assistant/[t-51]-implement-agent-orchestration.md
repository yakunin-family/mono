---
status: todo
priority: medium
description: Build the main agent orchestration layer using Vercel AI SDK's streamText for tool calling
tags: [backend, convex, ai, vercel-ai-sdk]
---

# Implement Agent Orchestration with Vercel AI SDK

Build the main agent orchestration layer using Vercel AI SDK's `streamText` for tool calling.

## Implementation

Create `convex/agent.ts` with the main handler:

```typescript
import { streamText } from "ai";
import { buildTeachingAssistantSystem } from "./_generated_prompts";

export const sendMessage = action({
  args: {
    sessionId: v.string(),
    message: v.string(),
    context: v.optional(contextValidator),
    model: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Get auth (teacherId)
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");
    const teacherId = identity.subject;

    // 2. Store user message
    await ctx.runMutation(internal.agent.storeMessage, {
      sessionId: args.sessionId,
      role: "user",
      content: args.message,
      context: args.context,
    });

    // 3. Get conversation history (last 10 messages)
    const history = await ctx.runQuery(internal.agent.getHistory, {
      sessionId: args.sessionId,
    });

    // 4. Build context description
    const contextDesc = args.context
      ? await buildContextDescription(ctx, args.context, teacherId)
      : "No active context - teacher is viewing the main interface";

    // 5. Generate system prompt
    const systemPrompt = buildTeachingAssistantSystem({
      contextDescription: contextDesc,
    });

    // 6. Call LLM with streaming + tools
    const { textStream } = await streamText({
      model: args.model ?? "openai/gpt-4o",
      system: systemPrompt,
      messages: history,
      tools: TOOL_REGISTRY,
      maxSteps: 5,
    });

    return textStream;
  },
});
```

## Helper Functions

* `buildContextDescription`: Translates context objects into human-readable descriptions
* `storeMessage`: Internal mutation to save messages
* `getHistory`: Internal query to fetch conversation history

## Acceptance Criteria

- [ ] Agent orchestration action implemented
- [ ] Uses Vercel AI SDK's `streamText` for streaming responses
- [ ] System prompt built dynamically with context
- [ ] Tool registry integrated
- [ ] Conversation history limited to last 10 messages
- [ ] Streams responses to client
- [ ] Error handling for LLM failures
