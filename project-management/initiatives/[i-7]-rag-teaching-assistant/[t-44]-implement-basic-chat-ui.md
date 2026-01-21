---
status: todo
priority: high
description: Create the chat interface components in the teacher app without agent/tool integration yet
tags: [frontend, teacher-app, ui]
---

# Implement Basic Chat UI (No Tools)

Create the chat interface components in the teacher app without agent/tool integration yet.

## Components to Create

1. **AssistantPanel** (`apps/teacher/src/components/assistant-panel.tsx`)
   * Right-side collapsible panel (384px width)
   * Header with close button
   * Contains TeachingAssistantChat component

2. **TeachingAssistantChat** (`apps/teacher/src/components/teaching-assistant-chat.tsx`)
   * Message list with scrolling
   * Input field with send button
   * Loading states
   * Captures context from route

3. **ChatMessage** (`apps/teacher/src/components/chat-message.tsx`)
   * User and assistant message display
   * Markdown rendering support

## Layout Integration

Update `apps/teacher/src/routes/_protected/_app/route.tsx`:

* Add assistant panel to right side of SidebarInset
* Add floating trigger button when collapsed
* Track sessionId with useState
* Extract context from current route

## Acceptance Criteria

- [ ] Chat panel opens/closes smoothly
- [ ] Messages display correctly (user vs assistant)
- [ ] Input field captures Enter key to send
- [ ] Context captured from route (space, document)
- [ ] Floating button appears when panel closed
- [ ] UI matches main app styling (white rounded card)
- [ ] No agent integration yet (hardcoded responses OK for testing)
