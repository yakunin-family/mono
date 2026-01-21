---
status: todo
priority: high
description: Implement semantic search functionality using Convex's native vector search
tags: [backend, convex, vector-search]
---

# Build Vector Search Action

Implement the semantic search functionality using Convex's native vector search.

## Implementation

Create `searchLibrary` internal action in `convex/library/search.ts`:

```typescript
export const searchLibrary = internalAction({
  args: {
    query: v.string(),
    limit: v.optional(v.number()), // Default 5
    filters: v.optional(v.object({
      type: v.optional(libraryItemTypeValidator),
      language: v.optional(v.string()),
      levels: v.optional(v.array(cefrLevelValidator)),
    })),
  },
  handler: async (ctx, args) => {
    // 1. Generate query embedding via OpenAI
    // 2. Call ctx.vectorSearch() with filters
    // 3. Post-filter for CEFR levels (not in vector index)
    // 4. Return top N results
  },
});
```

## Key Features

* Agent-callable tool (internal action)
* Supports filtering by type, language, CEFR levels
* Returns top N most similar items (default 5)
* Post-filters for array-based criteria (CEFR levels)

## Acceptance Criteria

- [ ] Vector search implemented using `ctx.vectorSearch()`
- [ ] Query embedding generated via OpenAI API
- [ ] Filters work correctly (type, language, levels)
- [ ] Returns cosine similarity scores
- [ ] Handles edge cases (empty results, no embeddings yet)
