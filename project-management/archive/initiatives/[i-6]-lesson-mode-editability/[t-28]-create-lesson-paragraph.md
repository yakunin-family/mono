---
status: done
priority: high
description: Create mode-aware paragraph extension with contentEditable
tags: [tiptap, extension]
references: blocked-by:t-27
---

# Create LessonParagraph Extension

## Description

Extend the default Paragraph extension to use contentEditable based on editor mode. In lesson modes, paragraphs should be read-only.

## Implementation Pattern

```typescript
export const LessonParagraph = Paragraph.extend({
  addNodeView() {
    return ReactNodeViewRenderer((props) => {
      const mode = props.editor.storage.editorMode;
      const isEditable = mode === 'teacher-editor';

      return (
        <NodeViewWrapper
          as="p"
          contentEditable={isEditable}
          suppressContentEditableWarning
        >
          <NodeViewContent />
        </NodeViewWrapper>
      );
    });
  },
});
```

## Files to Create

- `packages/editor/src/extensions/lesson-mode/LessonParagraph.ts`

## Acceptance Criteria

- [ ] Paragraph read-only in lesson modes
- [ ] Paragraph editable in teacher-editor mode
- [ ] Nested editability works (blanks inside)
- [ ] No TypeScript errors
