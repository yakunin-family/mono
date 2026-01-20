---
status: done
priority: high
description: Create React NodeView component with contentEditable
tags: [tiptap, react]
references: blocked-by:t-1
---

# Create NoteBlockView Component

## Description

Create the React component that renders the note block with visual styling and structure.

## Files to Create

- `packages/editor/src/extensions/NoteBlockView.tsx`

## Key Decisions

1. **contentEditable={true}:** Makes note always editable, even inside read-only content
2. **suppressContentEditableWarning:** React warns about contentEditable, this suppresses it
3. **NodeViewWrapper:** Use `<NodeViewWrapper>` as root element (required by Tiptap)
4. **NodeViewContent:** Use `<NodeViewContent>` to render inner block content
5. **Structure:** Header with icon + label, then content area
6. **No mode checking:** Note is always editable, no need to check `editor.storage.editorMode`

## Acceptance Criteria

- [ ] File created at `packages/editor/src/extensions/NoteBlockView.tsx`
- [ ] Uses `NodeViewWrapper` and `NodeViewContent` from `@tiptap/react`
- [ ] **`contentEditable={true}` set on NodeViewWrapper**
- [ ] **`suppressContentEditableWarning` included**
- [ ] Props typed as `NodeViewProps`
- [ ] Header displays emoji icon and "Note" label
- [ ] No TypeScript errors
