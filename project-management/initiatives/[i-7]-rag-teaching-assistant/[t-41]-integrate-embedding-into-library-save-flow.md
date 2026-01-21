---
status: todo
priority: high
description: Update library save mutation to automatically schedule background embedding generation
tags: [backend, convex, embeddings]
---

# Integrate Embedding Generation into Library Save Flow

Update the library save mutation to automatically schedule background embedding generation.

## Changes Needed

Update `convex/library.ts` (or wherever `saveItemWithMetadata` lives):

```typescript
export const saveItemWithMetadata = authedMutation({
  handler: async (ctx, args) => {
    // 1. Insert item without embedding (get ID)
    const itemId = await ctx.db.insert("library", {
      // ... existing fields
    });

    // 2. Schedule background embedding generation
    await ctx.scheduler.runAfter(0, internal.library.generateEmbedding, {
      itemId,
    });

    return itemId;
  },
});
```

## Acceptance Criteria

- [ ] Embedding generation scheduled on every library save
- [ ] Background job uses `ctx.scheduler.runAfter(0, ...)`
- [ ] Save operation remains fast (non-blocking)
- [ ] Embedding generation happens asynchronously
- [ ] Existing library items can be backfilled with embeddings
