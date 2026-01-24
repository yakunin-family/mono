---
status: todo
priority: high
description: Update chat-messages.tsx to handle streaming messages with typing indicator
tags: [ai, editor, streaming]
references: blocked-by:t-90
---

# Update ChatMessages for streaming

Modify the `chat-messages.tsx` component to handle streaming messages from the new `useStreamingChat` hook.

## Requirements

1. Update `chat-messages.tsx` to use streaming message interface
2. Show cursor/typing indicator while streaming (`|` or blinking cursor)
3. Support optimistic user message display
4. Handle the `isStreaming` state on messages
5. Auto-scroll to bottom as new content streams in

## UI States

**While streaming:**

```
+-------------------------------------------+
| User: Add an exercise                     |
+-------------------------------------------+
| Assistant: I've added a fill-in-the-|     |  <- cursor
+-------------------------------------------+
```

**After streaming complete:**

```
+-------------------------------------------+
| User: Add an exercise                     |
+-------------------------------------------+
| Assistant: I've added a fill-in-the-blank |
| exercise about verb conjugation.          |
+-------------------------------------------+
```

## File

`apps/teacher/src/spaces/document-editor/chat-messages.tsx`

## Acceptance Criteria

- [ ] Streaming messages show typing indicator
- [ ] Content appears progressively as it streams
- [ ] Chat auto-scrolls during streaming
- [ ] Optimistic user messages appear immediately
- [ ] Component handles both streaming and completed messages
