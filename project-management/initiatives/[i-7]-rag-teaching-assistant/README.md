---
status: in-progress
priority: high
description: AI teaching assistant that can navigate and operate across the entire teacher application
tags: [ai, backend, convex, teacher-app]
---

# RAG Teaching Assistant

## Vision

A full app controller - an AI teaching assistant that can navigate and operate across the entire teacher application. The assistant uses the library as its semantic knowledge base for pedagogical decisions, manages spaces, assigns homework, analyzes progress, and creates/edits lessons using relevant library content.

## Interaction Model

Chat interface (similar to ChatGPT/Claude):

- Persistent chat panel accessible globally via CMD+Shift+A
- Context-aware: knows what space/lesson/exercise you're viewing
- Streaming responses with tool execution visibility
- Session history persisted in database

## Milestones

### Foundation
- [t-39] Add embedding fields to library schema
- [t-40] Implement embedding generation mutation
- [t-41] Integrate embedding generation into library save flow
- [t-42] Build vector search action
- [t-43] Create chat session schema
- [t-44] Implement basic chat UI without tools

### Tool System
- [t-45] Define document operation tools (3 tools)
- [t-46] Define library operation tools (3 tools)
- [t-47] Define space and homework operation tools (6 tools)
- [t-48] Define context and read operation tools (3 tools)
- [t-49] Create tool registry and execution handler

### Agent Integration
- [t-50] Create teaching assistant system prompt template
- [t-51] Implement agent orchestration with Vercel AI SDK
- [t-52] Implement context capture and description builder
- [t-53] Wire up chat UI to agent backend
- [t-54] Add Hocuspocus HTTP endpoints for document editing

### Polish
- [t-55] Implement comprehensive error handling
- [t-56] Add loading states and optimistic updates
- [t-57] Implement cost tracking and monitoring
- [t-58] Testing and iteration

## Technical Stack

- **LLM**: OpenAI GPT-4o via Vercel AI SDK
- **Embeddings**: OpenAI text-embedding-3-small (1536 dimensions)
- **Vector Search**: Convex native vector search
- **Document Editing**: Hocuspocus HTTP API (for agent edits)
- **Frontend**: React components in teacher app

## Tool Categories

### Document Operations (3 tools)
- `create_lesson` - Create new lesson in a space
- `insert_content_to_document` - Add content via Hocuspocus HTTP API
- `insert_library_item` - Add library exercise to lesson

### Library Operations (3 tools)
- `search_library` - Semantic search using vector embeddings
- `save_to_library` - Save content to library
- `list_library_items` - Browse library by filters

### Space Operations (3 tools)
- `list_spaces` - See all teacher's spaces
- `get_space_details` - Get space info (students, lessons)
- `create_space_invite` - Generate invite link

### Homework Operations (3 tools)
- `assign_homework` - Mark exercises as homework
- `list_homework` - See homework status
- `get_student_progress` - View completion and performance

### Context Operations (3 tools)
- `get_current_context` - What's currently active
- `get_lesson_content` - Read lesson content
- `get_space_info` - Detailed space information

## Key Constraints

1. **Convex actions can't maintain WebSockets** - Agent uses HTTP endpoints to edit documents
2. **Auth context required** - All tools validate teacher ownership
3. **Streaming responses** - Better UX than waiting for full response
4. **Cost tracking** - Monitor LLM usage per teacher
