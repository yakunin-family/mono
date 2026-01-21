---
status: todo
priority: medium
description: Create tool definitions and handlers for library-related operations (3 tools)
tags: [backend, convex, tools]
---

# Define Library Operation Tools

Create tool definitions and handlers for library-related operations (3 tools).

## Tools to Implement

### 1. search_library

* **Description**: Search library for relevant exercises using semantic search (vector search)
* **Parameters**: `query`, `limit` (optional, default 5), `filters` (type, language, levels)
* **Handler**: `internal.library.searchLibrary` (already implemented in Phase 1)
* **Note**: Reuse the vector search action from Phase 1

### 2. save_to_library

* **Description**: Save current selection/content to library
* **Parameters**: `title`, `description`, `type`, `content`, `metadata`
* **Handler**: `internal.tools.library.saveToLibrary`

### 3. list_library_items

* **Description**: Browse library by metadata filters (non-semantic)
* **Parameters**: `filters` (type, language, levels, tags), `limit`, `offset`
* **Handler**: `internal.tools.library.listItems`
* **Note**: Standard database query, not vector search

## File Structure

Create `convex/tools/library.ts` for handlers 2 and 3.

## Acceptance Criteria

- [ ] All 3 tool definitions added to registry
- [ ] `search_library` integrated from Phase 1 implementation
- [ ] `save_to_library` creates new library items with proper validation
- [ ] `list_library_items` supports pagination and filtering
- [ ] Auth validation: teacher can only access their own library
- [ ] Error handling for validation failures
