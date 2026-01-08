# Task 5: Register Extension in Editor

## Description
Export the NoteBlock extension and register it in the DocumentEditor configuration so it's available for use.

## Files to Modify
- `packages/editor/src/extensions/index.ts` - Export the extension
- `packages/editor/src/DocumentEditor.tsx` - Add to editor extensions array

## Implementation

### Step 1: Export from Extensions Index

In `packages/editor/src/extensions/index.ts`:

```typescript
// Existing exports...
export { Blank } from "./Blank";
export { Exercise } from "./Exercise";
// ... other extensions

// Add NoteBlock export
export { NoteBlock } from "./NoteBlock";
```

### Step 2: Register in DocumentEditor

In `packages/editor/src/DocumentEditor.tsx`:

```typescript
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
// ... other imports

// Import NoteBlock
import { NoteBlock, Blank, Exercise /* ... other custom extensions */ } from "./extensions";

export function DocumentEditor({ documentId, canEdit, mode, websocketUrl, ... }: DocumentEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Collaboration.configure({
        document: ydoc,
      }),
      CollaborationCursor.configure({
        provider: provider,
      }),
      // Add NoteBlock extension
      NoteBlock,
      Blank,
      Exercise,
      // ... other extensions
    ],
    editable: canEdit,
    // ... other config
  });

  // ...
}
```

### Step 3: Verify Extension Order

Extension order can matter for some features. Place `NoteBlock`:
- **After** StarterKit (provides base functionality)
- **After** Collaboration extensions (ensures sync works)
- **Alongside** other custom nodes (Blank, Exercise)

## Extension Configuration

NoteBlock requires no special configuration for MVP:
```typescript
NoteBlock, // Uses default configuration
```

If you need to configure later:
```typescript
NoteBlock.configure({
  // Future options could go here
}),
```

## Acceptance Criteria

- [ ] NoteBlock exported from `extensions/index.ts`
- [ ] NoteBlock imported in `DocumentEditor.tsx`
- [ ] NoteBlock added to editor's extensions array
- [ ] Extension registered in correct order
- [ ] No TypeScript errors
- [ ] `pnpm --filter @package/editor build` succeeds
- [ ] No console errors when editor loads

## Testing

1. Build the editor package:
   ```bash
   pnpm --filter @package/editor build
   ```

2. Start teacher app:
   ```bash
   pnpm dev:teacher
   ```

3. Open a document in the editor

4. Open browser console and check:
   ```javascript
   // In browser console, check editor instance
   editor.extensionManager.extensions.find(ext => ext.name === 'noteBlock')
   // Should return the NoteBlock extension object
   ```

5. Try inserting a note via command:
   ```javascript
   editor.commands.insertNoteBlock()
   // Should insert a note block
   ```

## Troubleshooting

**If extension isn't registered:**
- Check export/import paths are correct
- Verify no circular dependencies
- Check browser console for errors
- Rebuild editor package

**If TypeScript errors:**
- Ensure NoteBlock.ts has no type errors
- Check that NoteBlockView is properly imported in NoteBlock.ts
- Run `pnpm --filter @package/editor check-types`

**If build fails:**
- Check all imports resolve correctly
- Verify no missing dependencies
- Check tsconfig.json paths are correct
