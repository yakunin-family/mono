# Task 1: Create NoteBlockView Component

## Description
Create the React component that renders the note block with visual styling and structure.

## Files to Create
- `packages/editor/src/extensions/NoteBlockView.tsx`

## Implementation

Create a new file `packages/editor/src/extensions/NoteBlockView.tsx`:

```typescript
import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from "@tiptap/react";

export function NoteBlockView({ node, editor }: NodeViewProps) {
  return (
    <NodeViewWrapper
      contentEditable={true}
      suppressContentEditableWarning
      className="note-block-wrapper"
    >
      <div className="note-block-container">
        <div className="note-block-header">
          <span className="note-block-icon">📝</span>
          <span className="note-block-label">Note</span>
        </div>
        <NodeViewContent className="note-block-content" />
      </div>
    </NodeViewWrapper>
  );
}
```

## Key Decisions

1. **contentEditable={true}:** Makes note always editable, even inside read-only content
2. **suppressContentEditableWarning:** React warns about contentEditable, this suppresses it
3. **NodeViewWrapper:** Use `<NodeViewWrapper>` as root element (required by Tiptap)
4. **NodeViewContent:** Use `<NodeViewContent>` to render inner block content
5. **Structure:** Header with icon + label, then content area
6. **Styling:** Classes for CSS targeting (styled in next task)
7. **No mode checking:** Note is always editable, no need to check `editor.storage.editorMode`

## Component Structure

```
NodeViewWrapper (Tiptap wrapper)
└─ .note-block-container (main container for styling)
   ├─ .note-block-header (visual header)
   │  ├─ .note-block-icon (📝 emoji)
   │  └─ .note-block-label ("Note" text)
   └─ NodeViewContent (renders inner blocks)
```

## Acceptance Criteria

- [ ] File created at `packages/editor/src/extensions/NoteBlockView.tsx`
- [ ] Uses `NodeViewWrapper` and `NodeViewContent` from `@tiptap/react`
- [ ] **`contentEditable={true}` set on NodeViewWrapper**
- [ ] **`suppressContentEditableWarning` included**
- [ ] Follows TypeScript best practices from CLAUDE.md
- [ ] No `as any` type assertions
- [ ] Props typed as `NodeViewProps`
- [ ] Header displays emoji icon and "Note" label
- [ ] No TypeScript errors

## References

See existing NodeView components:
- `packages/editor/src/extensions/BlankView.tsx` - Inline NodeView example
- `packages/editor/src/extensions/ExerciseView.tsx` - Block NodeView with content
