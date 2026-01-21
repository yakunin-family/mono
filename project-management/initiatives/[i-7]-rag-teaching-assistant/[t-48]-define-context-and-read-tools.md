---
status: todo
priority: medium
description: Create tool definitions and handlers for context awareness and read-only operations (3 tools)
tags: [backend, convex, tools]
---

# Define Context and Read Operation Tools

Create tool definitions and handlers for context awareness and read-only operations (3 tools).

## Tools to Implement

### 1. get_current_context

* **Description**: Returns what space/lesson/exercise is currently active
* **Parameters**: `context` (passed from UI: type + id)
* **Handler**: `internal.tools.context.getCurrent`
* **Note**: Enriches context with readable names and details

### 2. get_lesson_content

* **Description**: Read a specific lesson's content (Tiptap JSON)
* **Parameters**: `documentId`
* **Handler**: `internal.tools.context.getLessonContent`
* **Note**: Useful when agent needs to understand current document

### 3. get_space_info

* **Description**: Get detailed info about a space (overlaps with get_space_details but optimized for context)
* **Parameters**: `spaceId`
* **Handler**: `internal.tools.context.getSpaceInfo`

## File Structure

Create `convex/tools/context.ts` with all handler implementations.

## Acceptance Criteria

- [ ] All 3 tool definitions added to registry
- [ ] `get_current_context` translates context objects into human-readable descriptions
- [ ] `get_lesson_content` returns structured Tiptap JSON
- [ ] Auth validation: teacher can only read their own resources
- [ ] Error handling for invalid IDs
- [ ] Tools are read-only (no mutations)
