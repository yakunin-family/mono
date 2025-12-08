# Task 7: Create LessonText Extension

## Description
Create a mode-aware Text extension. The Text node is special in Tiptap—it represents the actual text content inside other nodes (paragraphs, headings, etc.). This extension may not need a custom NodeView since text editability is inherited from parent nodes.

## Background: Understanding Text Nodes

In Tiptap/ProseMirror:
- **Block nodes** (paragraph, heading) contain **text nodes**
- Text nodes don't render HTML elements themselves
- Text editability is controlled by parent contentEditable

Example structure:
```
Paragraph (contentEditable=false)
  └─ Text node: "Hello world"
```

The text inherits read-only from the paragraph.

## Decision: Do We Need a Custom Text Extension?

**Option A: No Custom Extension Needed**

If parent nodes (paragraph, heading, etc.) have `contentEditable={false}`, their text content automatically becomes non-editable. We may not need a custom Text extension at all.

**Option B: Custom Extension for Consistency**

Extend Text to match naming convention and ensure consistency, even if it doesn't need special behavior.

## Implementation

### Option A: Skip This Task (Recommended)

The default Text extension from StarterKit should work fine because:
- Text editability is controlled by parent nodes
- We're setting `contentEditable` on all parent nodes
- No special text-level behavior needed

**Action:** Keep default Text extension, don't create LessonText.

Update `packages/editor/src/DocumentEditor.tsx`:

```typescript
import StarterKit from '@tiptap/starter-kit';

const editor = useEditor({
  extensions: [
    StarterKit.configure({
      // Disable nodes we're replacing
      paragraph: false,
      heading: false,
      bulletList: false,
      orderedList: false,
      listItem: false,
      blockquote: false,
      codeBlock: false,
      // Keep default Text extension
      text: true, // Or just omit (true by default)
    }),
    // ... lesson-mode extensions
  ],
});
```

### Option B: Create LessonText for Consistency

If you want to be thorough:

Create `packages/editor/src/extensions/lesson-mode/LessonText.ts`:

```typescript
import Text from "@tiptap/extension-text";

export const LessonText = Text.extend({
  name: "text",

  // No custom NodeView needed - text nodes don't render
  // Editability is inherited from parent
});
```

This is essentially a no-op but maintains naming consistency.

## Recommendation

**Skip creating LessonText** (Option A) because:
1. Text editability is fully controlled by parent nodes
2. No custom behavior needed at text level
3. Default Text extension works perfectly
4. Reduces unnecessary code

## Testing

After registering other lesson-mode extensions (Task 8):

**Verify text behavior:**
- [ ] Text in read-only paragraphs is not editable
- [ ] Text in editable notes is editable
- [ ] Text selection works for copying
- [ ] No cursor placement in read-only text
- [ ] Inline formatting (bold, italic) works correctly

All of this should work without a custom Text extension.

## If Issues Arise

If you encounter issues where text is editable when it shouldn't be:

1. **Check parent contentEditable:** Ensure parent nodes have correct `contentEditable` values
2. **Check CSS:** Ensure no CSS is overriding editability
3. **Check extension order:** Text extension should come after parent node extensions

If problems persist, create LessonText with explicit non-editable behavior (Option B).

## Acceptance Criteria

### If Skipping (Option A):
- [ ] Default Text extension kept in StarterKit
- [ ] No LessonText file created
- [ ] Text editability works correctly via parent nodes
- [ ] Document this decision in task completion notes

### If Creating (Option B):
- [ ] File created at `packages/editor/src/extensions/lesson-mode/LessonText.ts`
- [ ] Extends `@tiptap/extension-text`
- [ ] No custom NodeView (text nodes don't render)
- [ ] Exported from `lesson-mode/index.ts`
- [ ] No TypeScript errors

## References

- Text extension: https://tiptap.dev/api/nodes/text
- ProseMirror text nodes: https://prosemirror.net/docs/ref/#model.Node.text
- How text nodes work: https://tiptap.dev/guide/node-views#text-nodes
