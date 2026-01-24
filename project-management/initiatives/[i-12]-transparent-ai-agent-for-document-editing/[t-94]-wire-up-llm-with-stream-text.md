---
status: todo
priority: high
description: Replace generateObject with streamText from Vercel AI SDK and configure tools
tags: [ai, editor, streaming]
references: blocked-by:t-92, blocked-by:t-93
---

# Wire up LLM with streamText and tools

Update the streaming endpoint to use Vercel AI SDK's `streamText` with tool support for the agent loop.

## Requirements

1. Update `/api/chat/stream` endpoint in `apps/backend/convex/http.ts`
2. Replace any existing `generateObject` usage with `streamText`
3. Configure tools array with `edit_document`
4. Set `maxSteps: 10` for agent loop (allows multiple tool calls)
5. Stream text chunks as SSE `text` events
6. Handle errors gracefully with SSE `error` events
7. Use `gpt-4o-mini` model

## Implementation

```typescript
const result = await streamText({
  model: openai("gpt-4o-mini"),
  system: buildSystemPrompt(),
  messages,
  tools: {
    edit_document: createEditDocumentTool(sendEvent),
  },
  maxSteps: 10,
});

// Stream text chunks
for await (const chunk of result.textStream) {
  sendEvent("text", { content: chunk });
}
```

## Agent Loop Behavior

With `maxSteps: 10`, the LLM can:

1. Reason about the request
2. Call a tool (e.g., `edit_document`)
3. Observe the result
4. Continue reasoning or respond

This allows for multi-step operations like: check rules → edit document → explain changes.

## File

`apps/backend/convex/http.ts`

## Acceptance Criteria

- [ ] `streamText` is used instead of `generateObject`
- [ ] `edit_document` tool is wired up
- [ ] `maxSteps: 10` allows agent loop
- [ ] Text chunks stream as SSE events
- [ ] Tool calls trigger `tool_start`/`tool_end` events
- [ ] Errors are sent as SSE `error` events
- [ ] Model is `gpt-4o-mini`
