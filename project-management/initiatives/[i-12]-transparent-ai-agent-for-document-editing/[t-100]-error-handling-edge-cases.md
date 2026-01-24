---
status: todo
priority: high
description: Handle stream disconnection, error states, input disabling, and timeouts
tags: [ai, editor, streaming]
references: blocked-by:t-89, blocked-by:t-90, blocked-by:t-91, blocked-by:t-92, blocked-by:t-93, blocked-by:t-94, blocked-by:t-95, blocked-by:t-96, blocked-by:t-97, blocked-by:t-98, blocked-by:t-99
---

# Error handling and edge cases

Implement comprehensive error handling for the streaming chat system.

## Requirements

### Stream Disconnection

- Detect when SSE stream disconnects unexpectedly
- Show reconnection message or error state
- Allow user to retry

### Error States in UI

- Tool failure: Show error icon and message on failed tool call
- LLM error: Show error message in place of assistant response
- Network error: Show connection error with retry option

### Input Behavior

- Disable chat input while streaming
- Show loading state on send button
- Re-enable after stream completes or errors

### Empty Responses

- Handle case where LLM returns empty response
- Show appropriate message to user

### Timeout Handling

- Set reasonable timeout for long-running requests
- Show timeout error if exceeded
- Allow user to retry

## UI Error States

**Tool failure:**

```
+-------------------------------------------+
| ✓ Checking fill-blanks rules              |
| ✗ Editing document - Invalid XML format   |
+-------------------------------------------+
| Sorry, I encountered an error...          |
+-------------------------------------------+
```

**Stream error:**

```
+-------------------------------------------+
| ⚠️ Connection lost. [Retry]               |
+-------------------------------------------+
```

**Timeout:**

```
+-------------------------------------------+
| ⚠️ Request timed out. [Retry]             |
+-------------------------------------------+
```

## Files

- `apps/teacher/src/spaces/document-editor/use-streaming-chat.ts`
- `apps/teacher/src/spaces/document-editor/chat-input.tsx`
- `apps/teacher/src/spaces/document-editor/chat-messages.tsx`
- `apps/backend/convex/http.ts`

## Acceptance Criteria

- [ ] Stream disconnection is detected and handled
- [ ] Tool failures show in UI with error message
- [ ] LLM errors display appropriate message
- [ ] Input is disabled during streaming
- [ ] Empty responses are handled gracefully
- [ ] Timeouts are enforced and communicated
- [ ] Retry functionality works for recoverable errors
