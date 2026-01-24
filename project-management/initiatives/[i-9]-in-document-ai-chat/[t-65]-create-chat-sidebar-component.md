---
status: done
priority: medium
description: Build collapsible chat sidebar component for document editor
tags: [ui, teacher-app]
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

- [x] Sidebar renders on right side of document editor
- [x] Toggle button shows/hides sidebar
- [x] Smooth animation for open/close
- [x] Responsive - handles narrow viewports gracefully
- [x] Integrates with existing editor layout without breaking it
- [x] Accessible (keyboard navigation, ARIA labels)

## Completed

- Created `apps/teacher/src/spaces/document-editor/chat-sidebar.tsx` with `ChatSidebar` and `ChatSidebarTrigger` components
- Integrated the sidebar into the lesson editor route (`apps/teacher/src/routes/_protected/spaces.$id_.lesson.$lessonId.tsx`)
- Sidebar appears on the right side of the document editor
- Toggle button in the header shows/hides the sidebar
- Smooth animation for open/close (200ms transition)
- localStorage persistence for open/closed state
- Sidebar squeezes the editor content (inline panel, not overlay)
- Accessible with ARIA labels

Ready for t-66 to add chat message display and input components.
