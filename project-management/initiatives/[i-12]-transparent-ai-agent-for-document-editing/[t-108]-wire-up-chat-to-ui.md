---
status: todo
priority: high
description: Integrate new chat hook and components with existing chat UI
tags: [editor, frontend]
references: blocked-by:t-106, t-107
---

# Wire up new chat to existing UI

Integrate the new Agent-based chat system with the existing chat sidebar and message components.

## Requirements

1. Update `chat-messages.tsx`:
   - Use new `UIMessage` format from Agent Component
   - Render messages using `MessageParts` component
   - Handle both user and assistant messages
   - Show tool calls inline in assistant messages

2. Update `chat-sidebar.tsx`:
   - Use `useDocumentChat` hook instead of old `useChat`
   - Pass document XML getter and edit handler
   - Wire up send message functionality
   - Remove old state management

3. Update lesson editor route:
   - Create or get thread for document on mount
   - Pass thread ID to chat sidebar
   - Handle thread creation loading state

4. Remove old hook usage:
   - Remove imports of old `useChat` hook
   - Remove old `useAiDocumentEdit` hook if exists

## Files

- `apps/teacher/src/spaces/document-editor/chat-messages.tsx`
- `apps/teacher/src/spaces/document-editor/chat-sidebar.tsx`
- `apps/teacher/src/routes/_protected/_app/lessons.$id.tsx` (or similar route file)

## Acceptance Criteria

- [ ] Chat sidebar uses new useDocumentChat hook
- [ ] Messages render with tool calls visible
- [ ] Sending messages triggers agent response
- [ ] Document edits from tool calls are applied to editor
- [ ] Old hooks no longer used
- [ ] Chat works end-to-end with streaming
