# Task 6: Update Interactive Nodes

## Description
Ensure that existing interactive nodes (Blank and Exercise) always have `contentEditable={true}` in their NodeViews, regardless of editor mode. This makes them editable even when nested inside read-only content.

**Note:** NoteBlock is handled by the `lesson-mode-notes` initiative and already implements `contentEditable={true}` correctly. This task focuses on updating existing interactive elements.

## Files to Modify
- `packages/editor/src/extensions/Blank.ts` (or BlankView.tsx if separate)
- `packages/editor/src/extensions/Exercise.ts` (or ExerciseView.tsx if separate)

## Implementation

### Step 1: Update Blank Node

If Blank uses a separate view component (`BlankView.tsx`):

```typescript
// In BlankView.tsx
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";

export function BlankView(props: NodeViewProps) {
  const { node, updateAttributes } = props as BlankNodeViewProps;

  return (
    <NodeViewWrapper
      as="span"
      contentEditable={true} // Always editable
      suppressContentEditableWarning
      className="inline-block"
    >
      {/* Blank input UI */}
      <input
        type="text"
        value={node.attrs.userInput || ""}
        onChange={(e) => updateAttributes({ userInput: e.target.value })}
        className="blank-input"
      />
    </NodeViewWrapper>
  );
}
```

Or if defined inline in `Blank.ts`:

```typescript
export const Blank = Node.create({
  // ... existing config

  addNodeView() {
    return ReactNodeViewRenderer((props: NodeViewProps) => {
      return (
        <NodeViewWrapper
          as="span"
          contentEditable={true} // Always editable
          suppressContentEditableWarning
        >
          {/* Blank UI */}
        </NodeViewWrapper>
      );
    });
  },
});
```

### Step 2: Update Exercise Node

If Exercise uses a separate view component:

```typescript
// In ExerciseView.tsx
export function ExerciseView(props: NodeViewProps) {
  return (
    <NodeViewWrapper
      contentEditable={true} // Always editable
      suppressContentEditableWarning
      className="exercise-block"
    >
      <div className="exercise-header">
        {/* Exercise UI */}
      </div>
      <NodeViewContent className="exercise-content" />
    </NodeViewWrapper>
  );
}
```

### Step 3: Verify Other Interactive Elements

If you have other interactive elements (custom exercises, quizzes, etc.), ensure they also use `contentEditable={true}`.

**Note blocks** are handled separately by the `lesson-mode-notes` initiative and should already have the correct implementation.

## Why This Works

When you nest `contentEditable` attributes:

```html
<p contenteditable="false">
  Read-only text
  <span contenteditable="true">Editable blank</span>
  more read-only text
</p>
```

The browser automatically handles the editability:
- Clicking in the `<p>` does nothing (can't place cursor)
- Clicking in the `<span>` allows editing
- `contentEditable="true"` overrides parent's `contentEditable="false"`

## Important: Don't Check Mode

Interactive nodes should **NOT** check `editor.storage.editorMode`:

```typescript
// ❌ WRONG - Don't do this
const mode = editor.storage.editorMode;
const isEditable = mode !== "student";
```

```typescript
// ✅ CORRECT - Always editable
contentEditable={true}
```

They're meant to be interactive in all modes, that's their purpose.

## Acceptance Criteria

- [ ] Blank node has `contentEditable={true}` in NodeViewWrapper
- [ ] Exercise node has `contentEditable={true}` in NodeViewWrapper
- [ ] Neither node checks `editor.storage.editorMode` for editability
- [ ] Both use `suppressContentEditableWarning`
- [ ] No TypeScript errors
- [ ] No use of `as any`
- [ ] `pnpm --filter @package/editor check-types` passes

## Testing

After all lesson-mode extensions are registered (Task 8):

### Blank Inside Read-Only Paragraph

**Setup:** Create a paragraph with a blank:
```
"The capital of France is [blank]."
```

**Test in Lesson Mode:**
- [ ] Cannot click/type in the paragraph text
- [ ] CAN click and type in the blank
- [ ] Blank input receives focus
- [ ] Can fill in the blank normally
- [ ] Paragraph remains read-only around the blank

### Exercise Block in Lesson Mode

**Test:**
- [ ] Can click inside exercise block
- [ ] Can edit exercise content
- [ ] Exercise remains interactive
- [ ] Surrounding content (if read-only) cannot be edited

### Note Block in Lesson Mode

**Note blocks are tested separately** in the `lesson-mode-notes` initiative. If note blocks are already implemented, verify they work correctly with the read-only system:
- [ ] Note blocks remain editable in lesson mode
- [ ] Content inside notes can be edited
- [ ] Surrounding lesson content is read-only

### Nested Scenarios

**Blank inside blockquote:**
```html
<blockquote contenteditable="false">
  <p contenteditable="false">
    "To be or not to <span contenteditable="true">[blank]</span>"
  </p>
</blockquote>
```
- [ ] Blockquote is read-only
- [ ] Blank is editable

**Blank inside list:**
```html
<ul contenteditable="false">
  <li contenteditable="false">
    <p contenteditable="false">
      Item with <span contenteditable="true">[blank]</span>
    </p>
  </li>
</ul>
```
- [ ] List is read-only
- [ ] Blank is editable

## Edge Cases

- Multiple blanks in same paragraph
- Blank at start/end of paragraph
- Blank adjacent to other inline formatting (bold, italic)
- Empty blanks
- Very long blank inputs

All should work correctly with nested `contentEditable`.

## References

- MDN contentEditable: https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/contenteditable
- Nested contentEditable behavior: https://html.spec.whatwg.org/multipage/interaction.html#attr-contenteditable
- See existing Blank.ts and Exercise.ts implementations
