---
status: todo
priority: medium
description: Create tool definitions and handlers for document-related operations (3 tools)
tags: [backend, convex, tools]
---

# Define Document Operation Tools

Create tool definitions and handlers for document-related operations (3 tools).

## Tools to Implement

### 1. create_lesson

* **Description**: Create a new lesson in a space with optional initial content
* **Parameters**: `spaceId`, `title`, `content` (optional Tiptap JSON)
* **Handler**: `internal.tools.document.createLesson`

### 2. insert_content_to_document

* **Description**: Insert content at specific position in a document via Hocuspocus HTTP API
* **Parameters**: `documentId`, `afterNodeId` (stable Tiptap node ID), `content` (Tiptap JSON)
* **Handler**: `internal.tools.document.insertContent`
* **Note**: Uses HTTP endpoint to Hocuspocus server

### 3. insert_library_item

* **Description**: Add a library exercise to the current lesson
* **Parameters**: `documentId`, `libraryItemId`, `position` (optional)
* **Handler**: `internal.tools.document.insertLibraryItem`

## File Structure

Create `convex/tools/document.ts` with all handler implementations.

## Acceptance Criteria

- [ ] All 3 tool definitions added to registry
- [ ] Tool schemas properly defined with required/optional params
- [ ] Handler functions implemented as internal actions/mutations
- [ ] Auth validation: verify teacher owns resources
- [ ] Error handling for invalid IDs or permissions
- [ ] Hocuspocus HTTP client implemented for `insert_content_to_document`
