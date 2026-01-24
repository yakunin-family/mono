---
status: done
priority: high
description: Build Convex mutations for creating chat sessions and sending messages
tags: [backend, convex]
references: blocked-by:t-67
---

# Implement Chat Mutations

Build the Convex mutations for managing chat sessions and messages.

## Implementation Completed

- Created `apps/backend/convex/chat.ts` with all queries and mutations
- `getSessionByDocument` query - finds existing session for user+document
- `getOrCreateSession` mutation - creates or returns existing session
- `getSessionMessages` query - returns messages mapped to frontend interface
- `sendMessage` mutation - stores user message, schedules AI action
- `createAssistantMessage` internal mutation - stores AI responses
- Conversation history limited to 20 messages for AI context
- All functions have proper auth checks via `hasDocumentAccess` and session ownership

## Mutations

### getOrCreateSession

Get existing chat session for document/user or create new one.

```typescript
export const getOrCreateSession = mutation({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    // Auth check
    // Find existing session or create new
    // Return session ID
  },
});
```

### sendMessage

Send a user message and trigger AI response.

```typescript
export const sendMessage = mutation({
  args: {
    sessionId: v.id("chatSessions"),
    content: v.string(),
    documentXml: v.string(), // Current document state
  },
  handler: async (ctx, args) => {
    // Store user message
    // Schedule AI response action
    // Return message ID
  },
});
```

## Queries

### getSessionMessages

Get all messages for a chat session.

```typescript
export const getSessionMessages = query({
  args: {
    sessionId: v.id("chatSessions"),
  },
  handler: async (ctx, args) => {
    // Return messages ordered by createdAt
  },
});
```

### getSessionByDocument

Get chat session for current document (if exists).

```typescript
export const getSessionByDocument = query({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    // Return session for current user + document
  },
});
```

## Acceptance Criteria

- [x] `getOrCreateSession` creates or returns existing session
- [x] `sendMessage` stores user message and schedules AI action
- [x] `getSessionMessages` returns ordered message history
- [x] `getSessionByDocument` returns session for document
- [x] All mutations/queries have proper auth checks
- [x] Real-time updates work (messages appear without refresh)
