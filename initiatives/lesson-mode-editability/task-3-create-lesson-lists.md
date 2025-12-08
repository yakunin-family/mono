# Task 3: Create LessonList Extensions

## Description
Create mode-aware list extensions for BulletList, OrderedList, and ListItem. Lists require all three components to work correctly.

## Files to Create
- `packages/editor/src/extensions/lesson-mode/LessonBulletList.ts`
- `packages/editor/src/extensions/lesson-mode/LessonOrderedList.ts`
- `packages/editor/src/extensions/lesson-mode/LessonListItem.ts`

## Files to Modify
- `packages/editor/src/extensions/lesson-mode/index.ts` - Add exports

## Implementation

### Step 1: Create LessonBulletList

Create `packages/editor/src/extensions/lesson-mode/LessonBulletList.ts`:

```typescript
import BulletList from "@tiptap/extension-bullet-list";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { NodeViewWrapper, NodeViewContent, type NodeViewProps } from "@tiptap/react";

export const LessonBulletList = BulletList.extend({
  name: "bulletList",

  addNodeView() {
    return ReactNodeViewRenderer((props: NodeViewProps) => {
      const { editor } = props;
      const mode = editor.storage.editorMode;
      const isEditable = mode === "teacher-editor";

      return (
        <NodeViewWrapper
          as="ul"
          contentEditable={isEditable}
          suppressContentEditableWarning
          className="lesson-bullet-list"
        >
          <NodeViewContent />
        </NodeViewWrapper>
      );
    });
  },
});
```

### Step 2: Create LessonOrderedList

Create `packages/editor/src/extensions/lesson-mode/LessonOrderedList.ts`:

```typescript
import OrderedList from "@tiptap/extension-ordered-list";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { NodeViewWrapper, NodeViewContent, type NodeViewProps } from "@tiptap/react";

export const LessonOrderedList = OrderedList.extend({
  name: "orderedList",

  addNodeView() {
    return ReactNodeViewRenderer((props: NodeViewProps) => {
      const { editor } = props;
      const mode = editor.storage.editorMode;
      const isEditable = mode === "teacher-editor";

      return (
        <NodeViewWrapper
          as="ol"
          contentEditable={isEditable}
          suppressContentEditableWarning
          className="lesson-ordered-list"
        >
          <NodeViewContent />
        </NodeViewWrapper>
      );
    });
  },
});
```

### Step 3: Create LessonListItem

Create `packages/editor/src/extensions/lesson-mode/LessonListItem.ts`:

```typescript
import ListItem from "@tiptap/extension-list-item";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { NodeViewWrapper, NodeViewContent, type NodeViewProps } from "@tiptap/react";

export const LessonListItem = ListItem.extend({
  name: "listItem",

  addNodeView() {
    return ReactNodeViewRenderer((props: NodeViewProps) => {
      const { editor } = props;
      const mode = editor.storage.editorMode;
      const isEditable = mode === "teacher-editor";

      return (
        <NodeViewWrapper
          as="li"
          contentEditable={isEditable}
          suppressContentEditableWarning
          className="lesson-list-item"
        >
          <NodeViewContent />
        </NodeViewWrapper>
      );
    });
  },
});
```

### Step 4: Add Exports

Update `packages/editor/src/extensions/lesson-mode/index.ts`:

```typescript
export { LessonParagraph } from "./LessonParagraph";
export { LessonHeading } from "./LessonHeading";
export { LessonBulletList } from "./LessonBulletList";
export { LessonOrderedList } from "./LessonOrderedList";
export { LessonListItem } from "./LessonListItem";
```

## How Lists Work in Tiptap

Lists have a nested structure:

```html
<ul> <!-- BulletList node -->
  <li> <!-- ListItem node -->
    <p>First item</p> <!-- Paragraph inside list item -->
  </li>
  <li>
    <p>Second item</p>
  </li>
</ul>
```

All three levels need `contentEditable` control:
- BulletList/OrderedList: Container level
- ListItem: Individual list items
- Paragraph: Text content (handled by LessonParagraph)

## Nested Editability

### Teacher-Editor Mode:
```html
<ul contenteditable="true">
  <li contenteditable="true">
    <p contenteditable="true">Editable item</p>
  </li>
</ul>
```

### Lesson Mode:
```html
<ul contenteditable="false">
  <li contenteditable="false">
    <p contenteditable="false">Read-only item</p>
  </li>
</ul>
```

### With Blank in List:
```html
<ul contenteditable="false">
  <li contenteditable="false">
    <p contenteditable="false">
      Item with <span contenteditable="true">[blank]</span>
    </p>
  </li>
</ul>
```

The blank remains editable despite all parent nodes being read-only.

## Acceptance Criteria

- [ ] LessonBulletList created with `as="ul"`
- [ ] LessonOrderedList created with `as="ol"`
- [ ] LessonListItem created with `as="li"`
- [ ] All extend respective Tiptap extensions
- [ ] All use mode-based `contentEditable`
- [ ] All exported from `lesson-mode/index.ts`
- [ ] No TypeScript errors
- [ ] No use of `as any`
- [ ] `pnpm --filter @package/editor check-types` passes

## Testing

After registration (Task 8):

**Bullet Lists:**
- [ ] Can create bullet list in editor mode
- [ ] Bullet list is read-only in lesson mode
- [ ] List items display with bullets
- [ ] Can add/remove items in editor mode
- [ ] Cannot edit list structure in lesson mode

**Ordered Lists:**
- [ ] Can create ordered list in editor mode
- [ ] Numbers display correctly (1, 2, 3, etc.)
- [ ] Read-only in lesson mode
- [ ] Can reorder items in editor mode

**Nested Lists:**
- [ ] Can create nested lists (list within list item)
- [ ] Indentation preserved
- [ ] All levels read-only in lesson mode
- [ ] Can tab to indent in editor mode

**With Interactive Elements:**
- [ ] Blank inside list item remains editable in lesson mode
- [ ] Can complete fill-in-the-blank exercises in lists
- [ ] Cursor can enter blank but not surrounding text

## Edge Cases

- Empty list items
- Very long list items
- Lists with inline formatting (bold, italic)
- Nested lists (3+ levels deep)
- Lists mixed with other block elements

## References

- BulletList: https://tiptap.dev/api/nodes/bullet-list
- OrderedList: https://tiptap.dev/api/nodes/ordered-list
- ListItem: https://tiptap.dev/api/nodes/list-item
- List behavior: https://tiptap.dev/api/nodes/list-item#keyboard-shortcuts
