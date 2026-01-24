---
status: todo
priority: critical
description: Disable automatic React re-renders on every Tiptap transaction
tags: [performance, editor, critical]
references: i-11
---

# Add shouldRerenderOnTransaction Option to useEditor

Add the `shouldRerenderOnTransaction: false` option to the `useEditor` hook to prevent unnecessary React re-renders on every Tiptap transaction.

## Problem

Location: `packages/editor/src/components/DocumentEditorInternal.tsx:94`

By default, Tiptap's `useEditor` hook triggers a React re-render on every transaction. A transaction occurs on:

- Every keystroke
- Every cursor movement
- Every selection change
- Every formatting change

This default behavior is often unnecessary because:

1. The `EditorContent` component handles its own updates
2. Only specific state changes (tracked via `useEditorState`) need React re-renders
3. The toolbar already handles its own state updates

## Solution

Add `shouldRerenderOnTransaction: false` to the useEditor configuration:

```typescript
const editor = useEditor({
  // ... existing options
  shouldRerenderOnTransaction: false,
  // ... rest of config
});
```

This tells Tiptap:

- Don't trigger React re-renders on every transaction
- Let EditorContent handle its own DOM updates
- Allow useEditorState to handle specific state subscriptions

## Considerations

After adding this option, verify that:

1. Components using `editor.isActive()` outside of `useEditorState` are migrated
2. Any direct `editor.state` access is wrapped in appropriate hooks
3. The EditorContent still updates correctly

## Files to Modify

- `packages/editor/src/components/DocumentEditorInternal.tsx`

## Acceptance Criteria

- [ ] Add `shouldRerenderOnTransaction: false` to useEditor options
- [ ] Verify editor content still updates on typing
- [ ] Verify toolbar still reflects correct state (after t-80 is implemented)
- [ ] Test collaboration still works correctly
- [ ] Measure re-render reduction with React DevTools Profiler
- [ ] No visual or functional regressions
