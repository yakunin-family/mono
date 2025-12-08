# Task 4: Create LessonBlockquote Extension

## Description
Create a mode-aware blockquote extension for quoted content with `contentEditable` control.

## Files to Create
- `packages/editor/src/extensions/lesson-mode/LessonBlockquote.ts`

## Files to Modify
- `packages/editor/src/extensions/lesson-mode/index.ts` - Add export

## Implementation

Create `packages/editor/src/extensions/lesson-mode/LessonBlockquote.ts`:

```typescript
import Blockquote from "@tiptap/extension-blockquote";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { NodeViewWrapper, NodeViewContent, type NodeViewProps } from "@tiptap/react";

export const LessonBlockquote = Blockquote.extend({
  name: "blockquote",

  addNodeView() {
    return ReactNodeViewRenderer((props: NodeViewProps) => {
      const { editor } = props;
      const mode = editor.storage.editorMode;
      const isEditable = mode === "teacher-editor";

      return (
        <NodeViewWrapper
          as="blockquote"
          contentEditable={isEditable}
          suppressContentEditableWarning
          className="lesson-blockquote"
        >
          <NodeViewContent />
        </NodeViewWrapper>
      );
    });
  },
});
```

Update `packages/editor/src/extensions/lesson-mode/index.ts`:

```typescript
export { LessonParagraph } from "./LessonParagraph";
export { LessonHeading } from "./LessonHeading";
export { LessonBulletList } from "./LessonBulletList";
export { LessonOrderedList } from "./LessonOrderedList";
export { LessonListItem } from "./LessonListItem";
export { LessonBlockquote } from "./LessonBlockquote";
```

## How Blockquotes Work

Blockquotes can contain multiple paragraphs and other block content:

```html
<blockquote>
  <p>First paragraph of quote</p>
  <p>Second paragraph of quote</p>
</blockquote>
```

## Nested Editability

### Teacher-Editor Mode:
```html
<blockquote contenteditable="true">
  <p contenteditable="true">Editable quote</p>
</blockquote>
```

### Lesson Mode:
```html
<blockquote contenteditable="false">
  <p contenteditable="false">Read-only quote</p>
</blockquote>
```

### With Interactive Elements:
```html
<blockquote contenteditable="false">
  <p contenteditable="false">
    "To be or not to <span contenteditable="true">[blank]</span>"
  </p>
</blockquote>
```

## Acceptance Criteria

- [ ] File created at `packages/editor/src/extensions/lesson-mode/LessonBlockquote.ts`
- [ ] Extends `@tiptap/extension-blockquote`
- [ ] Uses `as="blockquote"` for semantic HTML
- [ ] `contentEditable` based on editor mode
- [ ] Exported from `lesson-mode/index.ts`
- [ ] No TypeScript errors
- [ ] No use of `as any`
- [ ] `pnpm --filter @package/editor check-types` passes

## Testing

After registration (Task 8):

**Basic Functionality:**
- [ ] Can create blockquote in editor mode
- [ ] Blockquote displays with appropriate styling (indentation, border, etc.)
- [ ] Can type inside blockquote in editor mode
- [ ] Blockquote is read-only in lesson mode

**Multi-Paragraph Quotes:**
- [ ] Can have multiple paragraphs in blockquote
- [ ] Press Enter to create new paragraph in editor mode
- [ ] All paragraphs read-only in lesson mode

**With Interactive Elements:**
- [ ] Blank inside blockquote remains editable in lesson mode
- [ ] Can complete exercises within quotes
- [ ] Text selection works for copying quotes

**Edge Cases:**
- [ ] Empty blockquotes display correctly
- [ ] Blockquotes with inline formatting (bold, italic, links)
- [ ] Nested blockquotes (if supported by your editor)
- [ ] Long quotes with multiple paragraphs

## Typical Use Cases

Blockquotes in language learning might contain:
- Literary passages for analysis
- Example dialogues
- Reading comprehension passages
- Grammar examples with blanks to fill in

All should be read-only in lesson mode except interactive elements.

## References

- Default Blockquote extension: https://tiptap.dev/api/nodes/blockquote
- See LessonParagraph.ts for similar pattern
