---
status: todo
priority: medium
description: Use editor command pattern instead of window event for library modal trigger
tags: [code-quality, editor, architecture]
references: i-11
---

# Replace Window Event with Editor Command for Library Modal

Consider replacing the window event dispatch pattern for opening the library modal with a proper Tiptap editor command pattern for consistency and type safety.

## Problem

Location: `packages/editor/src/components/DocumentEditorInternal.tsx:193-199`

Currently, opening the library modal/drawer is triggered via a window event:

```typescript
// Current pattern
window.dispatchEvent(new CustomEvent("openLibraryModal", { detail: { ... } }));

// Listener somewhere else
window.addEventListener("openLibraryModal", handler);
```

Issues with window events:

1. Not type-safe (event detail is `any`)
2. Global scope pollution
3. Hard to trace event flow
4. Inconsistent with other editor interactions
5. Can't be easily tested

## Solution

Implement a proper Tiptap command pattern:

```typescript
// 1. Add command to Library extension
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    library: {
      openLibrary: (options: { documentId: string | null; mode: "add" | "update" }) => ReturnType;
    };
  }
}

// 2. Implement in extension
addCommands() {
  return {
    openLibrary: (options) => ({ editor }) => {
      // Store in editor storage or trigger callback
      editor.storage.library.pendingOpen = options;
      return true;
    },
  };
}

// 3. Use in components
editor.commands.openLibrary({ documentId: "...", mode: "add" });
```

Alternative: If commands feel heavy, use editor storage with a callback:

```typescript
// In useEditor setup
onOpenLibrary: (options) => {
  setLibraryOpen(true);
  setLibraryOptions(options);
};
```

## Consideration

This is a medium priority improvement. If the window event pattern is working reliably and the scope of changes would be large, it may be acceptable to defer this.

## Files to Modify

- `packages/editor/src/extensions/Library.ts` (or create)
- `packages/editor/src/components/DocumentEditorInternal.tsx`
- Any components dispatching the event
- Any components listening for the event

## Acceptance Criteria

- [ ] Evaluate scope of changes required
- [ ] If proceeding: implement editor command or callback pattern
- [ ] Remove window event dispatch and listeners
- [ ] Add TypeScript types for the interaction
- [ ] Verify library modal/drawer opens correctly
- [ ] Test the exercise → library flow works
