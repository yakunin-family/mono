# Task 0: Set Up Editor Mode Storage

## Description
Configure editor storage to track the current mode and make it accessible to all extensions via module augmentation. This provides type-safe access to `editor.storage.editorMode` throughout the codebase.

## Files to Modify
- `packages/editor/src/DocumentEditor.tsx`
- Create `packages/editor/src/extensions/EditorModeStorage.ts` (new file)

## Implementation

### Step 1: Create EditorModeStorage Extension

Create `packages/editor/src/extensions/EditorModeStorage.ts`:

```typescript
import { Extension } from "@tiptap/core";

export type EditorMode = "student" | "teacher-lesson" | "teacher-editor";

// Module augmentation for type safety
declare module "@tiptap/core" {
  interface Storage {
    editorMode: EditorMode;
  }
}

export const EditorModeStorage = Extension.create({
  name: "editorModeStorage",

  addStorage() {
    return {
      editorMode: "teacher-editor" as EditorMode,
    };
  },
});
```

### Step 2: Register Extension and Sync Mode

In `packages/editor/src/DocumentEditor.tsx`:

```typescript
import { useEditor, EditorContent } from "@tiptap/react";
import { EditorModeStorage, type EditorMode } from "./extensions/EditorModeStorage";

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
  // ... other props
}: DocumentEditorProps) {
  const editor = useEditor({
    extensions: [
      EditorModeStorage, // Register storage extension
      // ... other extensions
    ],
    editable: canEdit,
    onCreate: ({ editor }) => {
      // Initialize mode in storage
      editor.storage.editorMode = mode;
    },
    // ... other config
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

### Step 3: Export EditorMode Type

In `packages/editor/src/extensions/index.ts`:

```typescript
// Existing exports...
export { EditorModeStorage, type EditorMode } from "./EditorModeStorage";
```

Also export from main package:

In `packages/editor/src/index.ts`:

```typescript
// Export for consumers
export { type EditorMode } from "./extensions/EditorModeStorage";
```

## Type Safety Pattern

After this setup, any extension can access mode with full type safety:

```typescript
// In any extension NodeView
const mode = editor.storage.editorMode; // TypeScript knows this is EditorMode
```

No `as any` needed—TypeScript knows about the storage property via module augmentation.

## Important: Mode Updates

When `mode` prop changes:
1. Update `editor.storage.editorMode`
2. Call `editor.view.updateState(editor.state)` to trigger NodeView re-renders
3. All lesson-mode extensions will pick up the new mode automatically

## Acceptance Criteria

- [ ] `EditorModeStorage.ts` created with module augmentation
- [ ] Extension registered in DocumentEditor
- [ ] Mode synced from prop to storage on mount
- [ ] Mode synced when prop changes (useEffect)
- [ ] `editor.view.updateState()` called on mode change to trigger re-renders
- [ ] EditorMode type exported from package
- [ ] No TypeScript errors
- [ ] No use of `as any`
- [ ] `pnpm --filter @package/editor check-types` passes

## Testing

After implementation:

```typescript
// In browser console with editor instance
editor.storage.editorMode // Should return current mode
editor.storage.editorMode = "student"; // TypeScript should allow this
editor.storage.editorMode = "invalid"; // TypeScript should error
```

Test mode switching:
1. Start in teacher-editor mode
2. Switch to teacher-lesson mode via UI
3. Check `editor.storage.editorMode` in console
4. Verify it updated correctly

## References

- Tiptap storage documentation: https://tiptap.dev/api/extensions#storage
- Module augmentation: https://www.typescriptlang.org/docs/handbook/declaration-merging.html
- See existing storage usage in `ExerciseGeneration.ts` extension
