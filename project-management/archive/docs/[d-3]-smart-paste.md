---
type: document
description: Feature spec for importing existing materials and converting them into native editor content
tags: [ai, features, editor]
deprecated: true
superseded-by: d-5
---

# Smart Paste

> **DEPRECATED**: This standalone feature has been superseded by [d-5] In-Document AI Chat. The file upload/import functionality will be part of Phase 2 of the chat-based approach, where teachers can upload files as context for AI operations.

## Overview

A feature that allows teachers to import existing materials (images of worksheets, copied text) and automatically convert them into native editor content with properly structured exercise nodes.

**Key insight**: This doesn't feel like "AI" to users - it's a utility feature that happens to use AI under the hood. Appeals even to AI-skeptics.

## User Flow

1. Teacher clicks "Import materials" button in editor toolbar
2. Modal opens with text area + file upload/drag-and-drop zone
3. Teacher pastes text or drops an image (or both)
4. Teacher clicks "Import"
5. Modal closes, placeholder block appears in document showing progress
6. AI processes content, placeholder is replaced with structured content
7. Teacher reviews and fixes any issues inline in the editor

## Design Decisions

### Input

* **Text area + file upload with DND** - Simple, handles both text and images
* No mini-Tiptap in modal - adds unnecessary complexity
* Can paste text, drop images, or upload files

### Processing

* **Inline placeholder block** - Modal closes immediately, placeholder shows progress in document
* User can see where content will appear
* Future: Could add review state inside placeholder (not MVP)

### Output

* **Strictly conversion, no generation** - AI preserves original content, doesn't add or modify
* Supports all exercise types: fill-blanks, multiple choice, matching, etc.
* Content inserted directly, user fixes issues in editor (no preview step)

### AI Approach

* **Model**: GPT-4o via Vercel AI SDK (swappable later)
* **Structured output**: Use Zod schemas to validate AI response
* **Intermediate format**: Simplified JSON schema, not full Tiptap schema
  * Reduces hallucination risk
  * Keeps validation manageable
  * Transform to Tiptap nodes in code

### Intermediate Schema (conceptual)

```typescript
z.object({
  blocks: z.array(z.discriminatedUnion("type", [
    z.object({ type: z.literal("paragraph"), text: z.string() }),
    z.object({ type: z.literal("heading"), level: z.number(), text: z.string() }),
    z.object({ type: z.literal("exercise"), exerciseType: z.string(), content: z.any() }),
    // ... other block types
  ]))
})
```

Note: Exercise grouping/nesting (e.g., reading passage with comprehension questions) to be designed later. Start flat, restructure when patterns are clearer.

### Metadata

* **Not in MVP** - No auto-tagging for language, CEFR level, categories
* Can be added later as enhancement

## Out of Scope (for now)

* **Agentic AI chat** - Full app-level AI assistant discussed but deferred. Smart Paste is the first step.
* **Automatic paste detection** - No hijacking Cmd+V, explicit import action only
* **Preview before insert** - Direct insert, fix in editor
* **Source material linking** - No connection preserved to original image/text

## Technical Notes

* Placeholder block needs to be a Tiptap node that can replace itself
* File upload should accept common image formats (PNG, JPG, PDF pages)
* Text input should handle plain text and basic formatting
* Error handling: If AI fails, show error in placeholder with retry option

## Future Enhancements

* Review state in placeholder before final insert
* Auto-metadata extraction (language, level, tags)
* Smarter paste detection (offer to convert after regular paste)
* Agentic chat that can also trigger Smart Paste
