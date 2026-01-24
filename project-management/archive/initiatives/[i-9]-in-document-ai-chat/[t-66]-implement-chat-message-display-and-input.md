---
status: done
priority: medium
description: Build chat message list and input components for AI conversation
tags: [ui, teacher-app]
---

# Implement Chat Message Display and Input

Build the chat message list and input components that render inside the chat sidebar.

## Components

### ChatMessages

Scrollable list of messages showing conversation history.

```tsx
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  status?: "sending" | "sent" | "error";
}

<ChatMessages messages={messages} />;
```

**Features:**

- Auto-scroll to newest message
- Visual distinction between user and assistant messages
- Loading indicator for pending AI response
- Error state display for failed messages
- Timestamp display (relative time)

### ChatInput

Text input for sending messages to the AI.

```tsx
<ChatInput
  onSend={handleSend}
  isLoading={isLoading}
  placeholder="Ask AI to edit your document..."
/>
```

**Features:**

- Multi-line text input (auto-expand or textarea)
- Send button (disabled when empty or loading)
- Keyboard shortcut: Enter to send, Shift+Enter for newline
- Loading state prevents sending while AI is responding

## Design Notes

- Use existing UI components from `@package/ui` where possible
- Follow existing app styling patterns
- Keep messages simple text for MVP (no markdown rendering needed yet)

## Acceptance Criteria

- [ ] Messages display with clear user/assistant distinction
- [ ] Auto-scrolls to show new messages
- [ ] Input allows multi-line text
- [ ] Send works via button click and Enter key
- [ ] Loading state shown while awaiting AI response
- [ ] Error messages display clearly
- [ ] Empty input prevents sending

## Completed

- Created `chat-messages.tsx` with scrollable message list, user/assistant message styling, typing indicator, and error states
- Created `chat-input.tsx` with card-style container, auto-expanding textarea (max 8 lines), circular send button, Enter to send / Shift+Enter for newline
- Integrated components into lesson editor route with mock AI responses
- Used `Intl.RelativeTimeFormat` for time formatting (later removed as timestamps weren't needed)
