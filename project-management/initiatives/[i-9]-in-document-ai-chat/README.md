---
status: todo
priority: high
description: Chat sidebar where teachers instruct AI to edit documents in natural language
tags: [ai, editor, features]
references: d-5
---

# In-Document AI Chat

## Vision

A chat sidebar in the document editor where teachers can instruct an AI to edit the document. Instead of predefined buttons or forms, teachers describe what they want in natural language, and the AI makes the changes directly.

This initiative covers **Phase 1 (MVP)** as defined in [d-5].

## Scope

### In Scope (Phase 1)

- Chat sidebar UI component (collapsible, right side of editor)
- Chat session/conversation storage in Convex
- XML serialization for documents (toXML/fromXML)
- LLM integration with document context
- Full document replacement from AI response
- Strict error handling for invalid XML

### Out of Scope (Future Phases)

- File uploads (Phase 2)
- Library integration / RAG search (Phase 3)
- Streaming responses
- Partial document updates
- Multi-document operations

## Tasks

### XML Serialization

- [t-64] Implement document XML serialization (toXML/fromXML)

### Chat UI

- [t-65] Create chat sidebar component
- [t-66] Implement chat message display and input

### Backend

- [t-67] Add chat session schema to Convex
- [t-68] Implement chat mutations (create session, send message)
- [t-69] Build LLM integration action

### Document Integration

- [t-70] Implement document replacement from AI response

## Technical Approach

Per [d-5] design decisions:

- **Document Format**: Custom XML for AI reading/writing
- **Edit Approach**: Full document replacement (MVP simplicity)
- **Serialization Location**: `packages/editor` (toXML/fromXML functions)
- **Error Handling**: Strict - reject invalid XML entirely
- **Streaming**: None for MVP - complete response before applying

### Flow

1. Teacher opens chat sidebar
2. Teacher types instruction
3. Frontend sends message + current document XML to backend
4. Backend calls LLM with document context and instruction
5. LLM returns new complete document XML
6. Frontend parses XML and replaces document content
7. Yjs syncs changes via Hocuspocus automatically

## Success Criteria

- Teacher can open/close chat sidebar
- Teacher can send natural language instructions
- AI can read current document content
- AI can generate valid document XML
- Changes appear directly in the editor
- Invalid AI responses show clear error messages
- Chat history persists across page reloads
