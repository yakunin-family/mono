---
status: todo
priority: high
description: RAG library infrastructure for semantic search over teacher's content
tags: [ai, backend, convex]
---

# RAG Library

## Vision

A semantic search layer over the teacher's library content. Teachers build up a library of exercises, explanations, and teaching materials. This initiative adds vector embeddings to that content, enabling semantic search that powers AI features.

**What this is**: Infrastructure for embedding and searching library content.

**What this is NOT**: The AI assistant itself. The in-document AI chat ([d-5]) will use this infrastructure, but the chat UI, conversation management, and document editing capabilities are designed separately.

## Scope

### In Scope

- Embedding generation for library items
- Vector search over library content
- Schema updates to support embeddings

### Out of Scope (handled by d-5)

- Chat UI
- Conversation storage
- Document editing via AI
- Tool systems and agent orchestration

## Tasks

### Embedding Infrastructure
- [t-39] Add embedding fields to library schema
- [t-40] Implement embedding generation mutation
- [t-41] Integrate embedding generation into library save flow
- [t-42] Build vector search action

## Technical Stack

- **Embeddings**: OpenAI text-embedding-3-small (1536 dimensions)
- **Vector Search**: Convex native vector search
- **Storage**: Convex database

## Usage

Once complete, other features can use the vector search action to find semantically similar library content:

```typescript
// Example: Find library items similar to a query
const results = await ctx.runAction(api.library.semanticSearch, {
  query: "exercises about irregular verbs",
  limit: 5,
});
```

The in-document AI chat (Phase 3 per d-5) will use this to let teachers say things like "Find exercises about irregular verbs from my library and add them here."
