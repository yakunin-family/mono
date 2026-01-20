---
status: done
priority: high
description: Set up editor mode storage infrastructure for mode-aware extensions
tags: [tiptap, infrastructure]
---

# Set Up Editor Mode Storage

## Description

Create infrastructure for storing and accessing the editor mode in Tiptap extensions. This enables all mode-aware extensions to read the current mode.

## Implementation

Use Tiptap's storage system with module augmentation for type safety:

```typescript
declare module "@tiptap/core" {
  interface Storage {
    editorMode: "student" | "teacher-lesson" | "teacher-editor";
  }
}
```

Store mode in editor creation and update when mode prop changes.

## Files to Modify

- `packages/editor/src/DocumentEditor.tsx` - Set mode in storage
- `packages/editor/src/types.ts` - EditorMode type definition

## Acceptance Criteria

- [ ] Mode stored in editor storage
- [ ] Mode accessible from any extension
- [ ] TypeScript types correct
- [ ] Mode updates when prop changes
