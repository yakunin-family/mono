# Task 5: Create LessonCodeBlock Extension

## Description
Create a mode-aware code block extension for displaying code snippets with `contentEditable` control.

## Files to Create
- `packages/editor/src/extensions/lesson-mode/LessonCodeBlock.ts`

## Files to Modify
- `packages/editor/src/extensions/lesson-mode/index.ts` - Add export

## Implementation

Create `packages/editor/src/extensions/lesson-mode/LessonCodeBlock.ts`:

```typescript
import CodeBlock from "@tiptap/extension-code-block";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { NodeViewWrapper, NodeViewContent, type NodeViewProps } from "@tiptap/react";

export const LessonCodeBlock = CodeBlock.extend({
  name: "codeBlock",

  addNodeView() {
    return ReactNodeViewRenderer((props: NodeViewProps) => {
      const { editor } = props;
      const mode = editor.storage.editorMode;
      const isEditable = mode === "teacher-editor";

      return (
        <NodeViewWrapper className="lesson-code-block-wrapper">
          <pre>
            <code
              contentEditable={isEditable}
              suppressContentEditableWarning
              className="lesson-code-block"
            >
              <NodeViewContent />
            </code>
          </pre>
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
export { LessonCodeBlock } from "./LessonCodeBlock";
```

## How Code Blocks Work

Code blocks render as `<pre><code>` for proper monospace formatting:

```html
<pre>
  <code>
    function example() {
      return "hello";
    }
  </code>
</pre>
```

## Key Differences from Other Nodes

1. **Structure:** Uses `<pre><code>` wrapper
2. **contentEditable on `<code>`:** Not on the wrapper
3. **Preserves whitespace:** `<pre>` maintains formatting
4. **Monospace font:** Inherited from `<code>` element

## Nested Editability

### Teacher-Editor Mode:
```html
<pre>
  <code contenteditable="true">
    function add(a, b) {
      return a + b;
    }
  </code>
</pre>
```

### Lesson Mode:
```html
<pre>
  <code contenteditable="false">
    function add(a, b) {
      return a + b;
    }
  </code>
</pre>
```

## Language Learning Use Cases

Code blocks in language education might contain:
- Example grammar patterns
- Formatted text passages
- Poetry with preserved line breaks
- Structured dialogue examples

Usually these would be read-only reference material in lesson mode.

## Acceptance Criteria

- [ ] File created at `packages/editor/src/extensions/lesson-mode/LessonCodeBlock.ts`
- [ ] Extends `@tiptap/extension-code-block`
- [ ] Uses `<pre><code>` structure
- [ ] `contentEditable` applied to `<code>` element
- [ ] Mode-aware editability
- [ ] Exported from `lesson-mode/index.ts`
- [ ] No TypeScript errors
- [ ] No use of `as any`
- [ ] `pnpm --filter @package/editor check-types` passes

## Testing

After registration (Task 8):

**Basic Functionality:**
- [ ] Can create code block in editor mode
- [ ] Code block displays with monospace font
- [ ] Whitespace and line breaks preserved
- [ ] Can type and edit code in editor mode
- [ ] Code block is read-only in lesson mode

**Formatting:**
- [ ] Multiple lines display correctly
- [ ] Indentation preserved
- [ ] Tab key works in editor mode (if configured)
- [ ] Syntax highlighting works (if enabled)

**Read-Only Behavior:**
- [ ] Cannot edit code in lesson mode
- [ ] Can select and copy code
- [ ] No cursor appears when clicked in lesson mode
- [ ] Visual feedback indicates read-only state

**Edge Cases:**
- [ ] Empty code blocks
- [ ] Very long code blocks
- [ ] Code with special characters
- [ ] Code blocks adjacent to other elements

## Optional Enhancement (Post-MVP)

Consider adding language selection for syntax highlighting:

```typescript
addAttributes() {
  return {
    ...this.parent?.(),
    language: {
      default: null,
      parseHTML: element => element.getAttribute('data-language'),
      renderHTML: attributes => {
        if (!attributes.language) return {};
        return { 'data-language': attributes.language };
      },
    },
  };
},
```

This would allow:
```html
<code data-language="javascript" contenteditable="false">
  console.log("Hello");
</code>
```

Defer syntax highlighting to post-MVP if not immediately needed.

## References

- Default CodeBlock extension: https://tiptap.dev/api/nodes/code-block
- Code block styling: https://tiptap.dev/api/nodes/code-block#syntax-highlighting
- See LessonParagraph.ts for contentEditable pattern
