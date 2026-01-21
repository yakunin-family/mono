---
status: todo
priority: high
description: Add vector embedding fields to the existing library table in Convex schema
tags: [backend, convex, embeddings]
---

# Add Embedding Fields to Library Schema

Add vector embedding fields to the existing `library` table in Convex schema.

## Changes Needed

Update `convex/schema.ts`:

```typescript
// Add to existing library table
embedding: v.optional(v.array(v.number())), // 1536-dim vector
embeddingModel: v.optional(v.string()), // "text-embedding-3-small"

// Add vector index
.vectorIndex("embedding", {
  vectorField: "embedding",
  dimensions: 1536,
  filterFields: ["ownerId", "type", "metadata.language"],
})
```

## Acceptance Criteria

- [ ] `embedding` field added as optional array of numbers
- [ ] `embeddingModel` field added to track which model was used
- [ ] Vector index configured with 1536 dimensions
- [ ] Filter fields include `ownerId`, `type`, and `metadata.language`
- [ ] Schema validates successfully
- [ ] No breaking changes to existing library queries/mutations
