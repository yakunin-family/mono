---
status: todo
priority: medium
description: Build collapsible chat sidebar component for document editor
tags: [ui, teacher-app]
references: blocked-by:t-66
---

# Create Chat Sidebar Component

Build the collapsible chat sidebar that appears on the right side of the document editor in the teacher app.

## Layout

```
┌──────────┬─────────────────────────────────────┬───────────────────┐
│          │                                     │                   │
│   Nav    │      Document Editor                │   Chat Sidebar    │
│  Sidebar │        (existing)                   │   (new)           │
│          │                                     │                   │
└──────────┴─────────────────────────────────────┴───────────────────┘
```

## Implementation

### Location

`apps/teacher/src/spaces/document-editor/chat-sidebar.tsx`

### Features

- Collapsible panel (toggle button in editor toolbar or header)
- Resizable width (optional, can be fixed for MVP)
- Smooth open/close animation
- Persists open/closed state (localStorage or user preference)

### Structure

```tsx
<ChatSidebar isOpen={isOpen} onToggle={toggleOpen}>
  <ChatHeader onClose={handleClose} />
  <ChatMessages messages={messages} />
  <ChatInput onSend={handleSend} isLoading={isLoading} />
</ChatSidebar>
```

## Acceptance Criteria

- [ ] Sidebar renders on right side of document editor
- [ ] Toggle button shows/hides sidebar
- [ ] Smooth animation for open/close
- [ ] Responsive - handles narrow viewports gracefully
- [ ] Integrates with existing editor layout without breaking it
- [ ] Accessible (keyboard navigation, ARIA labels)
