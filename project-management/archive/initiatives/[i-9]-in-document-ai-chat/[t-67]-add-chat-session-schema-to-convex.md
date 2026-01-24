---
status: done
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
  documentId: v.id("document"),
  userId: v.string(),
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
- **`v.string()` for userId**: Matches existing codebase pattern (WorkOS IDs)
- **`v.id("document")` for documentId**: Matches existing table name (singular)

## Acceptance Criteria

- [x] `chatSessions` table defined with indexes
- [x] `chatMessages` table defined with indexes
- [x] Schema validates successfully (TypeScript passes)
- [x] Indexes support efficient queries by document, user, and session
