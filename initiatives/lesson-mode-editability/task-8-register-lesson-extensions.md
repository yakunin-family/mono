# Task 8: Register Lesson Mode Extensions

## Description
Replace StarterKit's default nodes with lesson-mode versions in the DocumentEditor configuration. This activates the contentEditable-based editability control.

## Files to Modify
- `packages/editor/src/DocumentEditor.tsx`
- `packages/editor/src/extensions/index.ts` (add exports)

## Implementation

### Step 1: Export Lesson Extensions

Update `packages/editor/src/extensions/index.ts`:

```typescript
// Existing exports
export { Blank } from "./Blank";
export { Exercise } from "./Exercise";
export { EditorModeStorage, type EditorMode } from "./EditorModeStorage";

// Export all lesson-mode extensions
export {
  LessonParagraph,
  LessonHeading,
  LessonBulletList,
  LessonOrderedList,
  LessonListItem,
  LessonBlockquote,
  LessonCodeBlock,
} from "./lesson-mode";
```

### Step 2: Update DocumentEditor Configuration

In `packages/editor/src/DocumentEditor.tsx`:

```typescript
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";

// Import lesson-mode extensions
import {
  EditorModeStorage,
  type EditorMode,
  LessonParagraph,
  LessonHeading,
  LessonBulletList,
  LessonOrderedList,
  LessonListItem,
  LessonBlockquote,
  LessonCodeBlock,
  Blank,
  Exercise,
  // ... other imports
} from "./extensions";

export interface DocumentEditorProps {
  documentId: string;
  canEdit: boolean;
  mode: EditorMode;
  websocketUrl?: string;
  // ... other props
}

export function DocumentEditor({
  documentId,
  canEdit,
  mode,
  websocketUrl = "ws://127.0.0.1:1234",
  // ... other props
}: DocumentEditorProps) {
  // ... Yjs setup

  const editor = useEditor({
    extensions: [
      // StarterKit with disabled nodes
      StarterKit.configure({
        // Disable nodes we're replacing with lesson-mode versions
        paragraph: false,
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        blockquote: false,
        codeBlock: false,
        // Keep other StarterKit features
        bold: true,
        italic: true,
        strike: true,
        code: true,
        history: true,
        dropcursor: true,
        gapcursor: true,
        hardBreak: true,
        horizontalRule: true,
        // text: true (default, keep unless you created LessonText)
      }),

      // Editor mode storage (must come early)
      EditorModeStorage,

      // Collaboration extensions
      Collaboration.configure({
        document: ydoc,
      }),
      CollaborationCursor.configure({
        provider: provider,
      }),

      // Lesson-mode content nodes
      LessonParagraph,
      LessonHeading,
      LessonBulletList,
      LessonOrderedList,
      LessonListItem,
      LessonBlockquote,
      LessonCodeBlock,

      // Interactive nodes (always editable)
      Blank,
      Exercise,
      // NoteBlock (if implemented),

      // Other custom extensions
      // ...
    ],
    editable: canEdit,
    onCreate: ({ editor }) => {
      // Initialize mode in storage
      editor.storage.editorMode = mode;
    },
  });

  // Sync mode changes to storage
  useEffect(() => {
    if (editor && editor.storage.editorMode !== mode) {
      editor.storage.editorMode = mode;
      // Force re-render of NodeViews to pick up new mode
      editor.view.updateState(editor.state);
    }
  }, [editor, mode]);

  // ... rest of component
}
```

## Extension Order Considerations

**Order matters for some extensions:**

1. **EditorModeStorage first:** Must be registered before lesson-mode nodes use it
2. **StarterKit early:** Provides base functionality (marks, etc.)
3. **Collaboration after StarterKit:** Ensures base nodes exist before syncing
4. **Lesson-mode nodes after storage:** So they can access `editor.storage.editorMode`
5. **Interactive nodes last:** Can override parent editability

## StarterKit Features to Keep

These work fine with lesson-mode:
- **Marks:** Bold, Italic, Strike, Code (inline styles)
- **History:** Undo/redo
- **Dropcursor:** Visual cursor when dragging
- **Gapcursor:** Allows cursor placement in tricky spots
- **HardBreak:** Line breaks (`<br>`)
- **HorizontalRule:** Horizontal lines (`<hr>`)

These inherit editability from parent nodes naturally.

## What Gets Replaced

| StarterKit Default | Lesson-Mode Version   | Reason                      |
|--------------------|-----------------------|-----------------------------|
| Paragraph          | LessonParagraph       | contentEditable control     |
| Heading            | LessonHeading         | contentEditable control     |
| BulletList         | LessonBulletList      | contentEditable control     |
| OrderedList        | LessonOrderedList     | contentEditable control     |
| ListItem           | LessonListItem        | contentEditable control     |
| Blockquote         | LessonBlockquote      | contentEditable control     |
| CodeBlock          | LessonCodeBlock       | contentEditable control     |
| Text               | (keep default)        | Inherits from parent        |

## Acceptance Criteria

- [ ] Lesson-mode extensions exported from `extensions/index.ts`
- [ ] StarterKit configured to disable replaced nodes
- [ ] Lesson-mode extensions registered in editor
- [ ] EditorModeStorage registered before lesson-mode nodes
- [ ] Mode synced from props to storage
- [ ] `editor.view.updateState()` called on mode change
- [ ] Interactive nodes registered
- [ ] No TypeScript errors
- [ ] `pnpm --filter @package/editor build` succeeds
- [ ] `pnpm --filter @package/editor check-types` passes

## Testing

After registration:

### Verify Extensions Loaded

In browser console:

```javascript
// Check registered extensions
editor.extensionManager.extensions.map(ext => ext.name)

// Should include:
// - "editorModeStorage"
// - "paragraph" (LessonParagraph)
// - "heading" (LessonHeading)
// - "bulletList", "orderedList", "listItem"
// - "blockquote", "codeBlock"
// - "blank", "exercise"
```

### Test Mode Switching

1. Start in teacher-editor mode
2. Type in a paragraph → should work
3. Switch to teacher-lesson mode
4. Try typing in paragraph → should not work
5. Check storage: `editor.storage.editorMode` → should be "teacher-lesson"

### Test Interactive Elements

1. Create paragraph with blank
2. Switch to lesson mode
3. Try typing in paragraph → blocked
4. Try typing in blank → works

### Test All Node Types

- [ ] Paragraphs work correctly
- [ ] Headings (all levels) work correctly
- [ ] Bullet lists work correctly
- [ ] Ordered lists work correctly
- [ ] Blockquotes work correctly
- [ ] Code blocks work correctly
- [ ] Blanks remain editable in lesson mode
- [ ] Exercises remain editable in lesson mode

## Troubleshooting

**If content is still editable in lesson mode:**
- Check `editor.storage.editorMode` value
- Verify mode is being synced from props
- Check that lesson-mode extensions are actually registered
- Inspect DOM: check `contenteditable` attributes

**If content is not editable in editor mode:**
- Check mode is "teacher-editor"
- Verify `isEditable` logic in each NodeView
- Check that mode comparison is correct

**If TypeScript errors:**
- Ensure EditorModeStorage module augmentation is imported
- Check all lesson-mode extension types are correct
- Verify imports resolve correctly

**If build fails:**
- Check circular dependencies
- Verify all files exist
- Run `pnpm --filter @package/editor check-types` for details

## Performance Check

With all custom NodeViews:
- [ ] Editor loads quickly
- [ ] No lag when typing
- [ ] Mode switching is instant
- [ ] Real-time sync still works
- [ ] No memory leaks (check DevTools)

## References

- StarterKit configuration: https://tiptap.dev/api/extensions/starter-kit#configure-included-extensions
- Extension order: https://tiptap.dev/guide/configuration#extension-priority
- See Task 0 for storage setup details
