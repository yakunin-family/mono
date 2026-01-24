---
status: todo
priority: high
description: Create Agent-based chat actions for thread and message management
tags: [ai, editor]
references: blocked-by:t-104
---

# Create Agent-based chat actions and queries

Implement the backend functions for chat using Convex Agent Component.

## Requirements

1. Create `createThread(documentId)` action:
   - Creates a new agent thread for the document
   - Associates thread with document ID
   - Returns thread ID

2. Create `getOrCreateThread(documentId)` helper:
   - Checks if thread exists for document
   - Creates new thread if not
   - Returns thread ID

3. Create `sendMessage(threadId, content, documentXml)` action:
   - Uses agent's `generateText` or `streamText` with streaming enabled
   - Includes current document XML in context
   - Saves user message to thread
   - Streams assistant response
   - Handles tool calls automatically via Agent Component

4. Create `listMessages(threadId)` query:
   - Uses `listUIMessages` from Agent Component
   - Returns messages in UI-friendly format
   - Supports `syncStreams` for real-time streaming updates

5. Replace or deprecate old chat.ts functions

## File

- `apps/backend/convex/chat.ts`

## Code Pattern

```ts
import { documentEditorAgent } from "./agents/document-editor";

export const sendMessage = action({
  args: {
    threadId: v.id("threads"),
    content: v.string(),
    documentXml: v.string(),
  },
  handler: async (ctx, args) => {
    const thread = await documentEditorAgent.getThread(ctx, args.threadId);

    // Stream the response
    const result = await thread.streamText({
      messages: [{ role: "user", content: args.content }],
      context: { documentXml: args.documentXml },
    });

    return result;
  },
});

export const listMessages = query({
  args: { threadId: v.id("threads") },
  handler: async (ctx, args) => {
    return await documentEditorAgent.listUIMessages(ctx, args.threadId);
  },
});
```

## Acceptance Criteria

- [ ] Thread can be created for a document
- [ ] Messages can be sent and streamed
- [ ] Tool calls are executed automatically
- [ ] Messages can be listed with streaming support
- [ ] Old chat functions removed or deprecated
