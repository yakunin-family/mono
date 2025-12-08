# Task 1: Create LessonParagraph Extension

## Description
Create a mode-aware paragraph extension that wraps Tiptap's default Paragraph with a custom NodeView using `contentEditable` to control editability based on mode.

## Files to Create
- `packages/editor/src/extensions/lesson-mode/LessonParagraph.ts`
- `packages/editor/src/extensions/lesson-mode/index.ts` (barrel export)

## Implementation

### Step 1: Create LessonParagraph Extension

Create `packages/editor/src/extensions/lesson-mode/LessonParagraph.ts`:

```typescript
import Paragraph from "@tiptap/extension-paragraph";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { NodeViewWrapper, NodeViewContent, type NodeViewProps } from "@tiptap/react";

export const LessonParagraph = Paragraph.extend({
  name: "paragraph", // Keep same name to maintain document structure

  addNodeView() {
    return ReactNodeViewRenderer((props: NodeViewProps) => {
      const { editor } = props;
      const mode = editor.storage.editorMode;

      // Only editable in teacher-editor mode
      const isEditable = mode === "teacher-editor";

      return (
        <NodeViewWrapper
          as="p"
          contentEditable={isEditable}
          suppressContentEditableWarning
          className="lesson-paragraph"
        >
          <NodeViewContent />
        </NodeViewWrapper>
      );
    });
  },
});
```

### Step 2: Create Barrel Export

Create `packages/editor/src/extensions/lesson-mode/index.ts`:

```typescript
export { LessonParagraph } from "./LessonParagraph";
// More exports will be added as other lesson-mode extensions are created
```

## Key Decisions

1. **Keep same name:** `name: "paragraph"` ensures document structure remains compatible
2. **as="p":** Renders as semantic `<p>` tag
3. **contentEditable based on mode:** Only editable in teacher-editor mode
4. **NodeViewContent:** Renders inner text and inline nodes (like blanks)
5. **suppressContentEditableWarning:** React warns about contentEditable, this suppresses it

## How It Works

### In Teacher-Editor Mode:
```html
<p contenteditable="true" class="lesson-paragraph">
  This text is editable
</p>
```

### In Teacher-Lesson or Student Mode:
```html
<p contenteditable="false" class="lesson-paragraph">
  This text is read-only
</p>
```

### With Nested Interactive Elements:
```html
<p contenteditable="false" class="lesson-paragraph">
  Text before <span contenteditable="true">[blank]</span> text after
</p>
```

The blank's `contentEditable="true"` overrides the paragraph's `contentEditable="false"`, making the blank editable even in a read-only paragraph.

## Acceptance Criteria

- [ ] File created at `packages/editor/src/extensions/lesson-mode/LessonParagraph.ts`
- [ ] Extends `@tiptap/extension-paragraph`
- [ ] Uses ReactNodeViewRenderer with NodeViewWrapper and NodeViewContent
- [ ] `contentEditable` based on `editor.storage.editorMode`
- [ ] Keeps `name: "paragraph"` for compatibility
- [ ] No TypeScript errors
- [ ] No use of `as any`
- [ ] Barrel export created at `lesson-mode/index.ts`
- [ ] `pnpm --filter @package/editor check-types` passes

## Testing

After creating the extension (before registering):

1. Import in test file:
   ```typescript
   import { LessonParagraph } from './extensions/lesson-mode';
   ```

2. Verify extension properties:
   ```typescript
   LessonParagraph.name // Should be "paragraph"
   ```

3. After registering (Task 8), test in browser:
   - Type in paragraph in teacher-editor mode → should work
   - Switch to lesson mode → paragraph should be read-only
   - Click paragraph in lesson mode → cursor shouldn't appear

## Edge Cases to Consider

1. **Empty paragraphs:** Should still render and be selectable (as node)
2. **Long text:** Should wrap normally, `contentEditable` doesn't affect layout
3. **Inline formatting:** Bold, italic within paragraph should inherit editability
4. **Nested blanks:** Blanks inside paragraph should remain editable in lesson mode

## References

- Default Paragraph extension: https://tiptap.dev/api/nodes/paragraph
- NodeViewWrapper: https://tiptap.dev/api/node-views/react#nodeviewwrapper
- NodeViewContent: https://tiptap.dev/api/node-views/react#nodeviewcontent
- See `packages/editor/src/extensions/Exercise.ts` for block NodeView example
