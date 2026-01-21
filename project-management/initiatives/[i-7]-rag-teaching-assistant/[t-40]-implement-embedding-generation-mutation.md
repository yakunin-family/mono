---
status: todo
priority: high
description: Create background action that generates embeddings for library items using OpenAI
tags: [backend, convex, embeddings, openai]
---

# Implement Embedding Generation Mutation

Create the background action that generates embeddings for library items using OpenAI's text-embedding-3-small model.

## Implementation

Create `convex/library/embeddings.ts`:

* `generateEmbedding` - Internal action that:
  * Fetches item metadata, title, description
  * Constructs text to embed (title + description + metadata)
  * Calls OpenAI embeddings API
  * Stores embedding back to database
* `storeEmbedding` - Internal mutation to save the embedding

## Key Decisions

* Embed metadata + title + description (not raw content)
* Use OpenAI `text-embedding-3-small` model
* Text to embed format: `[title, description, topic, ...tags, language, ...levels].join("\n")`

## Environment Variables

Requires `OPENAI_API_KEY` in Convex environment

## Acceptance Criteria

- [ ] `generateEmbedding` action implemented as internal function
- [ ] Calls OpenAI embeddings API correctly
- [ ] Stores 1536-dimension vector in database
- [ ] Error handling for API failures
- [ ] Logs embedding generation for debugging
