---
status: todo
priority: high
description: Create useDocumentChat hook using Agent Component React helpers
tags: [editor, frontend]
references: blocked-by:t-105
---

# Create useDocumentChat hook

Create the React hook for managing document chat using Convex Agent Component's React utilities.

## Requirements

1. Create `use-document-chat.ts` in document editor space

2. Use `useUIMessages` from `@convex-dev/agent/react`:
   - Pass thread ID
   - Enable `stream: true` for real-time streaming
   - Handle message loading states

3. Watch for `editDocument` tool results:
   - Monitor tool call completions
   - Extract XML operations from results
   - Apply operations to editor via callback
   - Track which results have been applied to avoid duplicates

4. Provide interface for sending messages:
   - Wrap the `sendMessage` action
   - Pass current document XML
   - Handle loading/error states

## File

- `apps/teacher/src/spaces/document-editor/use-document-chat.ts`

## Interface

```ts
interface UseDocumentChatOptions {
  threadId: Id<"threads">;
  getDocumentXml: () => string;
  onEditDocument: (operations: string) => void;
}

interface UseDocumentChatReturn {
  messages: UIMessage[];
  sendMessage: (content: string) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

export function useDocumentChat(
  options: UseDocumentChatOptions,
): UseDocumentChatReturn;
```

## Acceptance Criteria

- [ ] Hook subscribes to messages with streaming
- [ ] Messages update in real-time as they stream
- [ ] Tool results trigger onEditDocument callback
- [ ] Applied edits are tracked to prevent duplicates
- [ ] Loading and error states are exposed
