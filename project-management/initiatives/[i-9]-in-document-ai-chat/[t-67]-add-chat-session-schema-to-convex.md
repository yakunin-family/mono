---
status: todo
priority: high
description: Define Convex schema tables for chat sessions and messages
tags: [backend, convex]
---

# Add Chat Session Schema to Convex

Define the Convex schema tables for storing chat sessions and messages.

## Schema Design

### chatSessions table

```typescript
chatSessions: defineTable({
  documentId: v.id("documents"),
  userId: v.id("users"),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_document", ["documentId"])
  .index("by_user", ["userId"])
  .index("by_document_user", ["documentId", "userId"]);
```

### chatMessages table

```typescript
chatMessages: defineTable({
  sessionId: v.id("chatSessions"),
  role: v.union(v.literal("user"), v.literal("assistant")),
  content: v.string(),

  // For assistant messages, track what document state it produced
  documentXml: v.optional(v.string()),

  // Error tracking
  error: v.optional(v.string()),

  createdAt: v.number(),
})
  .index("by_session", ["sessionId"])
  .index("by_session_created", ["sessionId", "createdAt"]);
```

## Design Decisions

- **One session per document per user**: Each user has their own chat history for a document
- **Store document XML in messages**: Enables "undo" by reapplying previous AI response
- **Timestamps as numbers**: Standard Convex pattern for dates

## Acceptance Criteria

- [ ] `chatSessions` table defined with indexes
- [ ] `chatMessages` table defined with indexes
- [ ] Schema validates successfully
- [ ] Indexes support efficient queries by document, user, and session
