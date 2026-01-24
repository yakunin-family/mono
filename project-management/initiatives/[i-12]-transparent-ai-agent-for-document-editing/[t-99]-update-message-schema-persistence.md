---
status: todo
priority: high
description: Update chatMessages schema for tool calls and create persistence mutations
tags: [ai, editor, streaming]
---

# Update message schema and persistence

Update the database schema to store tool calls and create mutations for persisting messages after streaming completes.

## Schema Updates

Update `apps/backend/convex/schema.ts`:

```typescript
chatMessages: defineTable({
  sessionId: v.id("chatSessions"),
  role: v.union(v.literal("user"), v.literal("assistant")),
  createdAt: v.number(),

  // User messages
  content: v.optional(v.string()),

  // Assistant messages
  response: v.optional(v.object({
    text: v.string(),
    toolCalls: v.array(v.object({
      id: v.string(),
      tool: v.string(),
      args: v.any(),
      displayText: v.string(),
      status: v.union(v.literal("success"), v.literal("error")),
      error: v.optional(v.string()),
    })),
    documentXml: v.optional(v.string()),
  })),

  error: v.optional(v.string()),
  model: v.optional(v.string()),
})
.index("by_session_created", ["sessionId", "createdAt"]),
```

## Internal Mutations

Create in `apps/backend/convex/chat.ts`:

```typescript
// Create user message
export const createUserMessage = internalMutation({...});

// Create assistant message with tool calls
export const createAssistantMessage = internalMutation({...});
```

## Files

- `apps/backend/convex/schema.ts`
- `apps/backend/convex/chat.ts`

## Acceptance Criteria

- [ ] Schema includes `response.toolCalls` array
- [ ] Schema includes `response.documentXml` for final state
- [ ] Internal mutation creates user messages
- [ ] Internal mutation creates assistant messages with tool calls
- [ ] Existing message queries work with new schema
- [ ] Migration path for existing messages (if any)
