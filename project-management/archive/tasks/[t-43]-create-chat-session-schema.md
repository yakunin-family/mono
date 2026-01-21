---
status: todo
priority: high
description: Add database tables for storing AI chat sessions and messages
tags: [backend, convex, schema]
---

# Create Chat Session Schema

Add database tables for storing AI chat sessions and messages.

## Schema Additions

Add to `convex/schema.ts`:

```typescript
// Context discriminated union
const contextValidator = v.object({
  type: v.union(
    v.literal("space"),
    v.literal("document"),
    v.literal("exercise_node")
  ),
  id: v.string(),
});

// AI chat sessions
const aiChatSession = defineTable({
  teacherId: v.string(), // WorkOS user ID
  sessionId: v.string(), // Unique per conversation
  model: v.string(), // e.g., "openai/gpt-4o"
  status: v.union(v.literal("active"), v.literal("archived")),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_teacher", ["teacherId"])
  .index("by_session", ["sessionId"]);

// Messages with captured context
const aiChatMessage = defineTable({
  sessionId: v.string(),
  role: v.union(
    v.literal("user"),
    v.literal("assistant"),
    v.literal("tool")
  ),
  content: v.string(),
  context: v.optional(contextValidator),
  toolCalls: v.optional(v.array(v.any())),
  tokensUsed: v.optional(v.number()),
  createdAt: v.number(),
})
  .index("by_session", ["sessionId"]);
```

## Acceptance Criteria

- [ ] `aiChatSession` table created with proper indexes
- [ ] `aiChatMessage` table created with session index
- [ ] Context validator supports space, document, exercise_node types
- [ ] Schema validates successfully
- [ ] Tables support pagination for long conversations
