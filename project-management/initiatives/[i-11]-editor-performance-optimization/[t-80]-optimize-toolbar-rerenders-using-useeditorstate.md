---
status: todo
priority: critical
description: Replace forceUpdate on every transaction with useEditorState selectors
tags: [performance, editor, critical]
references: i-11
---

# Optimize Toolbar Re-renders Using useEditorState Selectors

Replace the current `forceUpdate` pattern that triggers on every transaction (every keystroke) with Tiptap's `useEditorState` hook and selectors for surgical re-renders.

## Problem

Location: `packages/editor/src/components/editor-toolbar.tsx:20-33`

The toolbar currently uses a `forceUpdate` pattern that triggers on every `transaction` event:

```typescript
// Current implementation (problematic)
const [, forceUpdate] = useReducer((x) => x + 1, 0);

useEffect(() => {
  const handler = () => forceUpdate();
  editor.on("transaction", handler);
  return () => editor.off("transaction", handler);
}, [editor]);
```

This causes:

1. Re-render on every keystroke
2. Re-render on every cursor movement
3. Unnecessary React reconciliation for unchanged toolbar state

## Solution

Use `useEditorState` from `@tiptap/react` with selectors to only re-render when toolbar-relevant state changes:

```typescript
import { useEditorState } from "@tiptap/react";

const editorState = useEditorState({
  editor,
  selector: (snapshot) => ({
    isBold: snapshot.editor.isActive("bold"),
    isItalic: snapshot.editor.isActive("italic"),
    isUnderline: snapshot.editor.isActive("underline"),
    isStrike: snapshot.editor.isActive("strike"),
    isCode: snapshot.editor.isActive("code"),
    currentHeadingLevel: snapshot.editor.isActive("heading")
      ? snapshot.editor.getAttributes("heading").level
      : null,
    isOrderedList: snapshot.editor.isActive("orderedList"),
    isBulletList: snapshot.editor.isActive("bulletList"),
    textAlign: snapshot.editor.getAttributes("paragraph").textAlign || "left",
    canUndo: snapshot.editor.can().undo(),
    canRedo: snapshot.editor.can().redo(),
  }),
});
```

Benefits:

- Only re-renders when selected values actually change
- Tiptap handles efficient comparison internally
- Follows official Tiptap v3 performance recommendations

## Files to Modify

- `packages/editor/src/components/editor-toolbar.tsx`

## Acceptance Criteria

- [ ] Remove `forceUpdate` and manual `transaction` listener
- [ ] Implement `useEditorState` with appropriate selectors
- [ ] All toolbar buttons reflect correct state
- [ ] Verify reduced re-renders (React DevTools Profiler)
- [ ] No regression in toolbar functionality
- [ ] Test with rapid typing to confirm performance improvement
