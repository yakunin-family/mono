---
status: todo
priority: high
description: Create useStreamingChat hook to replace use-chat.ts with SSE support
tags: [ai, editor, streaming]
references: blocked-by:t-89
---

# Implement SSE client hook

Create a new `useStreamingChat` hook that replaces the existing polling-based `use-chat.ts` with proper SSE streaming support.

## Requirements

1. Create `useStreamingChat` hook in `apps/teacher/src/spaces/document-editor/use-streaming-chat.ts`
2. Parse SSE events from fetch response stream
3. Handle event types: `text`, `tool_start`, `tool_end`, `done`, `error`
4. Manage state: `messages`, `pendingToolCalls`, `isStreaming`
5. Apply document changes when `tool_end` contains `documentXml`
6. Support optimistic user message display

## Interface

```typescript
interface StreamingMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls: ToolCall[];
  isStreaming: boolean;
  documentXml?: string;
  error?: string;
}

interface ToolCall {
  id: string;
  tool: string;
  displayText: string;
  status: "pending" | "success" | "error";
}

function useStreamingChat(sessionId: string, editor: Editor) {
  // Returns: { messages, pendingToolCalls, isStreaming, sendMessage }
}
```

## SSE Parsing

Parse events in format:

```
event: <type>
data: <json>

```

## File

`apps/teacher/src/spaces/document-editor/use-streaming-chat.ts`

## Acceptance Criteria

- [ ] Hook connects to `/api/chat/stream` endpoint
- [ ] SSE events are parsed correctly
- [ ] User messages appear optimistically
- [ ] Assistant messages stream in progressively
- [ ] Tool calls are tracked in `pendingToolCalls`
- [ ] Document XML from `tool_end` is applied to editor
- [ ] `isStreaming` state is accurate
