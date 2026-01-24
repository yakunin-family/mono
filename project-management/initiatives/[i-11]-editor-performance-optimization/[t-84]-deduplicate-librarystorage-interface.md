---
status: todo
priority: medium
description: Share single LibraryStorage interface definition instead of duplicating
tags: [code-quality, editor, typescript]
references: i-11
---

# Deduplicate LibraryStorage Interface Definition

Create a single shared definition for the `LibraryStorage` interface instead of duplicating it across files.

## Problem

The `LibraryStorage` interface is defined in multiple places:

- `packages/editor/src/components/ExerciseView.tsx`
- `packages/editor/src/components/DocumentEditorInternal.tsx`

Duplicate type definitions:

1. Can drift out of sync
2. Require updates in multiple places
3. Make the codebase harder to maintain
4. Violate DRY principle

## Solution

1. Create a shared types file or add to existing types:

```typescript
// packages/editor/src/types/storage.ts (or similar)
export interface LibraryStorage {
  libraryDocumentId: string | null;
  libraryMode: "add" | "update" | null;
}
```

2. Import and use in both files:

```typescript
import type { LibraryStorage } from "../types/storage";
```

3. Consider consolidating with other storage-related types if applicable.

## Alternative Approach

If the interface is tightly coupled with the Library extension, it could be exported from that extension file and imported where needed.

## Files to Modify

- Create: `packages/editor/src/types/storage.ts` (or add to existing types file)
- Update: `packages/editor/src/components/ExerciseView.tsx`
- Update: `packages/editor/src/components/DocumentEditorInternal.tsx`

## Acceptance Criteria

- [ ] Single source of truth for LibraryStorage interface
- [ ] Both consuming files import from shared location
- [ ] TypeScript compilation passes
- [ ] No runtime regressions
- [ ] Consider grouping with related storage types
