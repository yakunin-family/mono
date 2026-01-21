---
status: todo
priority: low
description: Improve UX with proper loading indicators and optimistic UI updates
tags: [frontend, teacher-app, ux]
---

# Add Loading States and Optimistic Updates

Improve UX with proper loading indicators and optimistic UI updates.

## Implementation

### 1. Chat Loading States

**While agent is thinking:**

* Show typing indicator with animated dots
* Disable input field during processing
* Show "Agent is searching library..." contextual messages

**During streaming:**

* Display partial response as it arrives
* Show cursor/caret at end of streaming text
* Smooth scroll to bottom

### 2. Tool Execution Visibility

Optional: Show which tools agent is calling

* "Searching library..."
* "Creating lesson..."
* "Homework assigned"
* Collapsible tool call details

### 3. Optimistic Updates

**Message sending:**

* Immediately show user message in chat
* Gray out until confirmed by server
* Roll back if send fails

**Document edits:**

* Changes appear via Yjs collaboration (no optimistic update needed)
* But show notification: "Agent added 3 exercises to your lesson"

### 4. Skeleton States

**On initial load:**

* Skeleton UI for message history
* Fade in when loaded

**Empty states:**

* Welcome message when no conversation yet
* Suggested prompts to get started

## UI Components

Create loading components:

* `LoadingIndicator` - Typing dots animation
* `ToolExecutionBadge` - Show tool being executed
* `MessageSkeleton` - Loading placeholder

## Acceptance Criteria

- [ ] Typing indicator shows during agent processing
- [ ] Streaming text displays smoothly
- [ ] User messages appear immediately (optimistic)
- [ ] Tool execution optionally visible to user
- [ ] Empty state shows welcome message
- [ ] Skeleton loaders on initial load
- [ ] Smooth animations and transitions
- [ ] Loading states are accessible (ARIA labels)
