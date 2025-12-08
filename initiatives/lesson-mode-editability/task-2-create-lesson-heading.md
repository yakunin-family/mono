# Task 2: Create LessonHeading Extension

## Description
Create a mode-aware heading extension that handles all heading levels (h1-h6) with `contentEditable` control based on mode.

## Files to Create
- `packages/editor/src/extensions/lesson-mode/LessonHeading.ts`

## Files to Modify
- `packages/editor/src/extensions/lesson-mode/index.ts` - Add export

## Implementation

Create `packages/editor/src/extensions/lesson-mode/LessonHeading.ts`:

```typescript
import Heading from "@tiptap/extension-heading";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { NodeViewWrapper, NodeViewContent, type NodeViewProps } from "@tiptap/react";

interface HeadingNodeViewProps extends NodeViewProps {
  node: NodeViewProps["node"] & {
    attrs: {
      level: 1 | 2 | 3 | 4 | 5 | 6;
    };
  };
}

export const LessonHeading = Heading.extend({
  name: "heading", // Keep same name

  addNodeView() {
    return ReactNodeViewRenderer((props: NodeViewProps) => {
      const { editor, node } = props as HeadingNodeViewProps;
      const mode = editor.storage.editorMode;
      const isEditable = mode === "teacher-editor";

      // Determine the heading tag (h1, h2, etc.)
      const HeadingTag = `h${node.attrs.level}` as keyof JSX.IntrinsicElements;

      return (
        <NodeViewWrapper
          as={HeadingTag}
          contentEditable={isEditable}
          suppressContentEditableWarning
          className="lesson-heading"
        >
          <NodeViewContent />
        </NodeViewWrapper>
      );
    });
  },
});
```

Add to `packages/editor/src/extensions/lesson-mode/index.ts`:

```typescript
export { LessonParagraph } from "./LessonParagraph";
export { LessonHeading } from "./LessonHeading";
```

## Key Decisions

1. **Dynamic heading tag:** Uses `node.attrs.level` to render h1-h6
2. **Type-safe level:** HeadingNodeViewProps ensures level is 1-6
3. **Same name:** Maintains compatibility with existing documents
4. **Shared editability logic:** All heading levels use same mode check

## How It Works

### Rendering Different Levels:

**Level 1 (teacher-editor mode):**
```html
<h1 contenteditable="true" class="lesson-heading">
  Main Title
</h1>
```

**Level 2 (lesson mode):**
```html
<h2 contenteditable="false" class="lesson-heading">
  Subsection
</h2>
```

All six levels work the same way, just different HTML tags.

## Acceptance Criteria

- [ ] File created at `packages/editor/src/extensions/lesson-mode/LessonHeading.ts`
- [ ] Extends `@tiptap/extension-heading`
- [ ] Handles all heading levels (1-6)
- [ ] Uses correct heading tag based on `node.attrs.level`
- [ ] `contentEditable` based on editor mode
- [ ] Proper TypeScript types for heading props
- [ ] No use of `as any`
- [ ] Exported from `lesson-mode/index.ts`
- [ ] No TypeScript errors
- [ ] `pnpm --filter @package/editor check-types` passes

## Testing

After registration (Task 8), test each heading level:

**Teacher-Editor Mode:**
- [ ] H1 is editable
- [ ] H2 is editable
- [ ] H3 is editable
- [ ] Can convert between heading levels
- [ ] Can type in headings normally

**Lesson Mode:**
- [ ] H1 is read-only
- [ ] H2 is read-only
- [ ] Cannot type in headings
- [ ] Can select heading text for copying
- [ ] Heading styling preserved

**Edge Cases:**
- [ ] Empty headings display correctly
- [ ] Long heading text wraps properly
- [ ] Inline formatting (bold, italic) works in editor mode
- [ ] Inline blanks in headings remain editable in lesson mode (if applicable)

## References

- Default Heading extension: https://tiptap.dev/api/nodes/heading
- Heading levels configuration: https://tiptap.dev/api/nodes/heading#levels
- See LessonParagraph.ts for similar pattern
