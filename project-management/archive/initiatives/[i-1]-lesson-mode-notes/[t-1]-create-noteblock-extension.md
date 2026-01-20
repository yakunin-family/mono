---
status: done
priority: high
description: Create core Tiptap extension for note block node type
tags: [tiptap, extension]
---

# Create NoteBlock Extension

## Description

Create the core Tiptap extension for the note block node type with proper TypeScript types and configuration.

## Files to Create

- `packages/editor/src/extensions/NoteBlock.ts`

## Key Decisions

1. **Block-level node:** `group: "block"` makes it a top-level element
2. **Flexible content:** `content: "block+"` allows paragraphs, lists, headings inside
3. **No nesting:** `defining: true` prevents notes inside notes
4. **HTML serialization:** Uses `data-type="note-block"` for parsing/rendering
5. **Command:** `insertNoteBlock()` command for programmatic insertion

## Acceptance Criteria

- [ ] File created at `packages/editor/src/extensions/NoteBlock.ts`
- [ ] Extension follows Tiptap patterns (see Blank.ts and Exercise.ts as examples)
- [ ] No TypeScript errors
- [ ] No use of `as any` type assertions
- [ ] `defining: true` prevents nesting
- [ ] Command `insertNoteBlock()` is defined
- [ ] ReactNodeViewRenderer references NoteBlockView
