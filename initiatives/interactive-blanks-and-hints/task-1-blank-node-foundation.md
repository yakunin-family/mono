# Task 1: Blank Node Foundation

## Objective
Create the core Blank extension as a custom inline Tiptap node with mode detection and placeholder rendering.

## Prerequisites
None - this is the foundation task

## Files to Create

### `/packages/editor/src/extensions/Blank.ts`
- Define custom inline node with `inline: true, atom: true`
- **Attributes:**
  - `blankIndex: number` - position in sentence (0, 1, 2...)
  - `correctAnswer: string`
  - `alternativeAnswers: string[]`
  - `hint: string | null`
  - `studentAnswer: string`
- Follow pattern from `Exercise.ts` (lines 10-56)
- Use `ReactNodeViewRenderer(BlankView)`

### `/packages/editor/src/extensions/BlankView.tsx`
- Basic React NodeView with mode detection
- Use `NodeViewWrapper as="span"` for inline rendering
- Access mode: `editor.storage.editorMode`
- For now, render placeholder text based on mode:
  - `student`: "[Student Input Placeholder]"
  - `teacher-lesson`: "[Teacher Lesson Placeholder]"
  - `teacher-editor`: "[Teacher Editor Placeholder]"

### `/packages/editor/src/types.ts`
Add `EditorMode` type:
```typescript
export type EditorMode =
  | "student"
  | "teacher-lesson"
  | "teacher-editor";
```

## Files to Modify

### `/packages/editor/src/components/DocumentEditor.tsx`
- Add `mode?: EditorMode` prop (optional, default to "student")
- Pass mode to `DocumentEditorInternal`

### `/packages/editor/src/components/DocumentEditorInternal.tsx`
- Accept `mode` prop in interface (line ~24)
- Store in editor storage (similar to lines 101-108):
  ```typescript
  useEffect(() => {
    if (editor) {
      editor.storage.editorMode = mode;
    }
  }, [editor, mode]);
  ```
- Register Blank extension in extensions array (line ~80):
  ```typescript
  extensions: [
    // ... existing extensions
    Blank,
    // ...
  ]
  ```

### `/packages/editor/src/index.ts`
Export new extension and types:
```typescript
export { Blank } from "./extensions/Blank";
export type { EditorMode } from "./types";
```

## Acceptance Criteria
- [ ] Blank node can be manually inserted into editor
- [ ] Node renders as inline element (within text flow)
- [ ] Different placeholder text appears based on mode
- [ ] Mode can be switched and view updates
- [ ] No TypeScript errors
- [ ] Editor still works for existing functionality

## Testing Steps
1. Insert blank manually via editor commands:
   ```typescript
   editor.chain().focus().insertContent({
     type: "blank",
     attrs: {
       blankIndex: 0,
       correctAnswer: "test",
       alternativeAnswers: [],
       hint: "test hint",
       studentAnswer: "",
     }
   }).run()
   ```
2. Verify it renders inline within a paragraph
3. Change mode prop and verify placeholder text changes
4. Verify cursor can move around (but not into) the blank node

## Notes
- This task establishes the foundation - no actual UI components yet
- Focus on getting the node structure and mode system working
- Actual input/badge components come in later tasks
