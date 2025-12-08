# Task 3: Implement Note Insertion UI

## Description
Add UI controls for teachers to insert note blocks. Start with a toolbar button (simpler MVP approach) rather than floating "+" button.

## Files to Modify
- `packages/editor/src/DocumentEditorToolbar.tsx` (or wherever toolbar is defined)

## Implementation

Add a toolbar button for inserting notes in lesson mode:

```typescript
// In DocumentEditorToolbar.tsx or similar

import { Editor } from "@tiptap/core";

interface ToolbarProps {
  editor: Editor;
  mode: "student" | "teacher-lesson" | "teacher-editor";
}

export function DocumentEditorToolbar({ editor, mode }: ToolbarProps) {
  // Existing toolbar buttons...

  // Add note button - only visible in teacher-lesson mode
  const showNoteButton = mode === "teacher-lesson";

  return (
    <div className="editor-toolbar">
      {/* Existing buttons */}

      {showNoteButton && (
        <button
          type="button"
          onClick={() => editor.commands.insertNoteBlock()}
          className="toolbar-button"
          title="Insert Note"
        >
          📝 Note
        </button>
      )}
    </div>
  );
}
```

## Alternative: Slash Command

For better UX, also consider adding a slash command:

```typescript
// In NoteBlock.ts extension, add to addCommands():
addCommands() {
  return {
    insertNoteBlock: () => ({ commands }) => {
      return commands.insertContent({
        type: this.name,
        content: [{ type: "paragraph" }],
      });
    },
  };
},

// Can be triggered with slash menu if you have one
// e.g., typing "/note" inserts a note block
```

## UI Considerations

**MVP Approach (Toolbar Button):**
- ✅ Simple to implement
- ✅ Predictable location
- ✅ Clear affordance
- ❌ Less contextual than floating button

**Future Enhancement (Floating "+" Button):**
- Show "+" button on hover between blocks
- Requires mouse position tracking
- More polished but complex
- Defer to post-MVP

## Acceptance Criteria

- [ ] Toolbar button added for inserting notes
- [ ] Button only visible when `mode === "teacher-lesson"`
- [ ] Clicking button inserts a note block at cursor position
- [ ] Button has clear label ("📝 Note" or similar)
- [ ] Button styled consistently with other toolbar buttons
- [ ] No TypeScript errors
- [ ] Works with keyboard focus (cursor in editor)

## Testing

1. Switch to teacher-lesson mode
2. Verify note button appears in toolbar
3. Click button → note block inserted at cursor
4. Insert multiple notes → verify they don't nest
5. Switch to teacher-editor mode → button should hide (notes can be inserted normally)
6. Switch to student mode → button should hide

## Future Enhancement Notes

When ready to implement floating "+" button:
- Create `InsertNoteButton.tsx` component
- Track mouse position over editor
- Calculate positions between block elements
- Show "+" button on hover in gutters
- Reference: Notion-style block insertion
