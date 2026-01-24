---
status: todo
priority: high
description: Merge 4 separate useEffect hooks for editor storage into a single efficient effect
tags: [performance, editor, react]
references: i-11
---

# Consolidate Multiple useEffect Hooks for Storage Setup

Merge the multiple separate useEffect hooks that update editor storage into a single consolidated effect for better performance and maintainability.

## Problem

Location: `packages/editor/src/components/DocumentEditorInternal.tsx:158-191`

Currently there are 4 separate useEffect hooks with overlapping dependencies:

```typescript
// Effect 1: mode
useEffect(() => {
  if (editor) {
    editor.storage.editorMode = mode;
  }
}, [editor, mode]);

// Effect 2: canEdit
useEffect(() => {
  if (editor) {
    editor.setEditable(canEdit);
  }
}, [editor, canEdit]);

// Effect 3: libraryDocumentId + libraryMode
useEffect(() => {
  if (editor) {
    editor.storage.libraryDocumentId = libraryDocumentId;
    editor.storage.libraryMode = libraryMode;
  }
}, [editor, libraryDocumentId, libraryMode]);

// Effect 4: exerciseGeneration
useEffect(() => {
  if (editor) {
    editor.storage.exerciseGeneration = exerciseGeneration;
  }
}, [editor, exerciseGeneration]);
```

Issues:

1. Multiple effect cleanup/setup cycles when `editor` changes
2. Repeated null checks
3. Harder to reason about initialization order
4. Potential for race conditions during editor initialization

## Solution

Consolidate into a single useEffect:

```typescript
useEffect(() => {
  if (!editor) return;

  // Update all storage values
  editor.storage.editorMode = mode;
  editor.storage.libraryDocumentId = libraryDocumentId;
  editor.storage.libraryMode = libraryMode;
  editor.storage.exerciseGeneration = exerciseGeneration;

  // Update editable state
  editor.setEditable(canEdit);
}, [editor, mode, canEdit, libraryDocumentId, libraryMode, exerciseGeneration]);
```

Benefits:

- Single effect lifecycle
- One null check
- Clear initialization order
- Easier to maintain and debug

## Consideration

Ensure that updating all values together doesn't cause any side effects. Each storage update should be idempotent.

## Files to Modify

- `packages/editor/src/components/DocumentEditorInternal.tsx`

## Acceptance Criteria

- [ ] Consolidate 4 useEffect hooks into 1
- [ ] Maintain same functionality
- [ ] Verify mode switching works correctly
- [ ] Verify canEdit toggle works correctly
- [ ] Verify library mode works correctly
- [ ] Verify exercise generation works correctly
- [ ] No regressions in any editor behavior
