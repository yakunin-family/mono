# Lesson Mode Editability via ContentEditable

## Overview
Implement true read-only behavior for lesson mode using nested `contentEditable` attributes. This makes non-interactive content truly non-editable while keeping notes, blanks, and exercises editable—all handled natively by the browser without transaction filtering or CSS hacks.

## Problem
Currently, the editor lacks proper read-only enforcement in lesson mode. The CSS `pointer-events` approach is a UI-level hack that:
- Can be bypassed programmatically
- Doesn't provide true editability control
- Feels like a workaround rather than a proper solution

For production, we need a robust, maintainable approach that:
- Prevents editing of main lesson content
- Allows editing of interactive elements (notes, blanks, exercises)
- Works naturally with browser behavior
- Handles nested editability (blanks inside read-only paragraphs)
- Maintains document structure for collaboration

## Solution
Use nested `contentEditable` attributes via custom Tiptap NodeViews:

```html
<div contenteditable="true"> <!-- Editor root -->
  <p contenteditable="false">Read-only content</p>
  <p contenteditable="false">
    Text with <span contenteditable="true">[blank]</span> inside
  </p>
  <div contenteditable="true">Editable note</div>
</div>
```

**Key insight:** Content doesn't need to be editable Tiptap nodes in lesson mode—they're functionally like image nodes (atomic, no cursor inside), but with `contentEditable` controlling the behavior instead of `atom: true`.

**Implementation:**
- Extend StarterKit nodes with custom NodeViews
- Set `contentEditable` based on editor mode
- Interactive elements (notes, blanks, exercises) always have `contentEditable={true}`
- Browser handles editability natively—no transaction filtering needed

## Tasks

0. **[Set Up Editor Mode Storage](./task-0-setup-editor-mode-storage.md)** - Infrastructure for mode-aware extensions
1. **[Create LessonParagraph Extension](./task-1-create-lesson-paragraph.md)** - Mode-aware paragraph with contentEditable
2. **[Create LessonHeading Extension](./task-2-create-lesson-heading.md)** - Mode-aware headings (all levels)
3. **[Create LessonList Extensions](./task-3-create-lesson-lists.md)** - BulletList, OrderedList, ListItem
4. **[Create LessonBlockquote Extension](./task-4-create-lesson-blockquote.md)** - Mode-aware blockquotes
5. **[Create LessonCodeBlock Extension](./task-5-create-lesson-codeblock.md)** - Mode-aware code blocks
6. **[Update Interactive Nodes](./task-6-update-interactive-nodes.md)** - Ensure blanks and exercises always editable
7. **[Create LessonText Extension](./task-7-create-lesson-text.md)** - Handle text node editability
8. **[Register Lesson Mode Extensions](./task-8-register-lesson-extensions.md)** - Replace StarterKit nodes with lesson versions
9. **[Add Visual Feedback](./task-9-add-visual-feedback.md)** - Style read-only content with subtle cues
10. **[Test Nested Editability](./task-10-test-nested-editability.md)** - Comprehensive testing across modes

## Dependencies

**Packages:**
- `@tiptap/core` - Already installed
- `@tiptap/react` - Already installed
- `@tiptap/starter-kit` - Already installed
- `@tiptap/extension-paragraph` - Part of StarterKit
- `@tiptap/extension-heading` - Part of StarterKit
- `@tiptap/extension-blockquote` - Part of StarterKit
- `@tiptap/extension-code-block` - Part of StarterKit
- `@tiptap/extension-list-item` - Part of StarterKit
- `@tiptap/extension-bullet-list` - Part of StarterKit
- `@tiptap/extension-ordered-list` - Part of StarterKit
- `@tiptap/extension-text` - Part of StarterKit

**Commands:**
- `pnpm --filter @package/editor build` - Build editor package
- `pnpm --filter @package/editor check-types` - Type check
- `pnpm dev:teacher` - Test teacher app
- `pnpm dev:student` - Test student app

**Prerequisites:**
- Existing editor mode system (`mode` prop with values: `"student"` | `"teacher-lesson"` | `"teacher-editor"`)
- Existing interactive nodes (Blank, Exercise) need to be updated

**Related Initiatives:**
- **lesson-mode-notes** - Note blocks feature (developed independently)
  - Note blocks implement `contentEditable={true}` within their own initiative
  - When both initiatives are complete, note blocks automatically work correctly with the read-only system
  - These initiatives are **independent** and can be developed in any order or in parallel
  - Note blocks serve as a reference implementation for interactive elements

## Key Files

**Files to Create:**
- `packages/editor/src/extensions/lesson-mode/LessonParagraph.ts`
- `packages/editor/src/extensions/lesson-mode/LessonHeading.ts`
- `packages/editor/src/extensions/lesson-mode/LessonBulletList.ts`
- `packages/editor/src/extensions/lesson-mode/LessonOrderedList.ts`
- `packages/editor/src/extensions/lesson-mode/LessonListItem.ts`
- `packages/editor/src/extensions/lesson-mode/LessonBlockquote.ts`
- `packages/editor/src/extensions/lesson-mode/LessonCodeBlock.ts`
- `packages/editor/src/extensions/lesson-mode/LessonText.ts`
- `packages/editor/src/extensions/lesson-mode/index.ts` - Barrel export
- `packages/editor/src/styles/lesson-mode.css` - Visual styling

**Files to Modify:**
- `packages/editor/src/DocumentEditor.tsx` - Register lesson-mode extensions, set up storage
- `packages/editor/src/extensions/Blank.ts` - Ensure always editable
- `packages/editor/src/extensions/Exercise.ts` - Ensure always editable
- `packages/editor/src/extensions/NoteBlock.ts` - Ensure always editable
- `packages/editor/src/extensions/index.ts` - Export lesson-mode extensions

## Technical Approach

### ContentEditable Pattern

Each extended node follows this pattern:

```typescript
import OriginalNode from '@tiptap/extension-<node>';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { NodeViewWrapper, NodeViewContent, type NodeViewProps } from '@tiptap/react';

// Module augmentation for type safety
declare module "@tiptap/core" {
  interface Storage {
    editorMode: "student" | "teacher-lesson" | "teacher-editor";
  }
}

export const LessonNode = OriginalNode.extend({
  name: 'lessonNode', // Keep same name or use new name

  addNodeView() {
    return ReactNodeViewRenderer((props: NodeViewProps) => {
      const { editor } = props;
      const mode = editor.storage.editorMode;

      // Only editable in teacher-editor mode
      const isEditable = mode === 'teacher-editor';

      return (
        <NodeViewWrapper
          as="div" // or "p", "blockquote", etc.
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

### Storage Setup

Initialize editor mode in storage:

```typescript
// In DocumentEditor.tsx
const editor = useEditor({
  onCreate: ({ editor }) => {
    // Set initial mode in storage
    editor.storage.editorMode = mode;
  },
  onUpdate: ({ editor }) => {
    // Update if mode prop changes
    if (editor.storage.editorMode !== mode) {
      editor.storage.editorMode = mode;
    }
  },
  extensions: [/* ... */],
});
```

### Interactive Nodes Pattern

Always-editable nodes (notes, blanks, exercises):

```typescript
export const InteractiveNode = Node.create({
  addNodeView() {
    return ReactNodeViewRenderer(() => {
      return (
        <NodeViewWrapper
          contentEditable={true} // Always editable
        >
          {/* content */}
        </NodeViewWrapper>
      );
    });
  },
});
```

### Nested Editability

Browser automatically handles nested `contentEditable`:

```html
<p contenteditable="false">
  Read-only text
  <span contenteditable="true">editable blank</span>
  more read-only text
</p>
```

This works because child `contentEditable="true"` overrides parent `contentEditable="false"`.

### Extension Registration

Replace StarterKit nodes with lesson-mode versions:

```typescript
import StarterKit from '@tiptap/starter-kit';
import { LessonParagraph, LessonHeading, /* ... */ } from './extensions/lesson-mode';

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
      text: false,
    }),
    // Add lesson-mode versions
    LessonParagraph,
    LessonHeading,
    LessonBulletList,
    LessonOrderedList,
    LessonListItem,
    LessonBlockquote,
    LessonCodeBlock,
    LessonText,
    // Interactive nodes (always editable)
    Blank,
    Exercise,
    NoteBlock,
    // Other extensions...
  ],
});
```

## Success Criteria

- [ ] Task 0 complete - Editor mode storage configured
- [ ] Task 1 complete - LessonParagraph created
- [ ] Task 2 complete - LessonHeading created
- [ ] Task 3 complete - LessonList extensions created
- [ ] Task 4 complete - LessonBlockquote created
- [ ] Task 5 complete - LessonCodeBlock created
- [ ] Task 6 complete - Interactive nodes updated
- [ ] Task 7 complete - LessonText created
- [ ] Task 8 complete - Extensions registered
- [ ] Task 9 complete - Visual feedback added
- [ ] Task 10 complete - Testing passed

**Acceptance Criteria:**

### Teacher-Editor Mode
- [ ] All content is editable
- [ ] No visual read-only indicators
- [ ] Full formatting capabilities

### Teacher-Lesson Mode
- [ ] Main content (paragraphs, headings, lists, etc.) is read-only
- [ ] Cannot type or edit main content
- [ ] Can edit note blocks
- [ ] Can edit blank inputs
- [ ] Can edit exercise content
- [ ] Read-only content has subtle visual cue (optional slight opacity)
- [ ] Can select and copy read-only text

### Student Mode
- [ ] Same behavior as teacher-lesson mode
- [ ] Main content is read-only
- [ ] Interactive elements are editable
- [ ] Cannot create new note blocks (UI restriction, not editability)

### Nested Editability
- [ ] Blanks inside read-only paragraphs are editable
- [ ] Content inside note blocks is editable
- [ ] Nested lists work correctly
- [ ] No cursor trapping in read-only areas

### Collaboration
- [ ] Yjs syncs content correctly across modes
- [ ] Teacher editing in editor mode syncs to student in lesson mode
- [ ] Real-time collaboration works in note blocks
- [ ] No conflicts or data loss

### Performance
- [ ] No noticeable lag with custom NodeViews
- [ ] Documents with 50+ nodes perform well
- [ ] Mode switching is instant (no re-render delays)

## Future Enhancements

**Out of scope for MVP:**
- HorizontalRule, HardBreak read-only handling (evaluate if needed)
- Custom read-only styling per node type
- "View mode" for completely non-editable documents (no interactive elements)
- Granular permissions (some paragraphs editable, others not)
- Role-based editability (beyond teacher/student)
- Transaction-level validation (optional belt-and-suspenders approach)
- Drag-and-drop restrictions for read-only content
- Context menu customization for read-only vs editable areas
- Accessibility improvements (ARIA attributes for read-only state)

## Architecture Benefits

This approach provides:

1. **Native browser behavior** - No fighting against contentEditable
2. **No transaction filtering** - Simpler, more maintainable code
3. **True editability control** - Not bypassable like CSS
4. **Nested editability** - Inline interactive elements work naturally
5. **Clear semantics** - `contentEditable` is standard HTML
6. **Collaboration-friendly** - Document structure unchanged
7. **Performance** - Browser handles editability efficiently
8. **Long-term maintainable** - Standard patterns, easy to debug
9. **Extensible** - Easy to add new node types with same pattern

## Related Initiatives

- **lesson-mode-notes** - Note blocks that are always editable
  - **Independent initiatives** - can be developed in any order or in parallel
  - Note blocks implement `contentEditable={true}` within their own initiative
  - This initiative provides the broader contentEditable system for read-only content
  - When both are complete, note blocks automatically integrate correctly due to nested `contentEditable` behavior
  - Note blocks serve as the first reference implementation of always-editable interactive elements
