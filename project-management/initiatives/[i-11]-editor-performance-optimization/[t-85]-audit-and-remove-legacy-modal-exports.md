---
status: todo
priority: medium
description: Review and remove unused LibraryModal and SaveToLibraryModal exports
tags: [code-quality, editor, cleanup]
references: i-11
---

# Audit and Remove Legacy Modal Exports

Review the editor package exports to identify and remove legacy modal components that have been replaced by Drawer versions.

## Problem

Location: `packages/editor/src/index.ts`

The package exports appear to include both:

- `LibraryModal` / `SaveToLibraryModal` (potentially legacy)
- `LibraryDrawer` / `SaveToLibraryDrawer` (potentially current)

If the Modal versions are no longer used:

1. They add unnecessary bundle size
2. They create confusion about which to use
3. They may have outdated implementations

## Investigation Required

1. Search for usages of `LibraryModal` and `SaveToLibraryModal` in:
   - `apps/teacher/`
   - `apps/student/`

2. Determine if Modal versions are:
   - Still in use (keep them)
   - Deprecated but needed for transition (mark deprecated)
   - Completely unused (remove them)

## Potential Actions

If unused:

```typescript
// Remove from index.ts exports
export { LibraryModal } from "./components/LibraryModal"; // DELETE
export { SaveToLibraryModal } from "./components/SaveToLibraryModal"; // DELETE

// Keep drawer versions
export { LibraryDrawer } from "./components/LibraryDrawer";
export { SaveToLibraryDrawer } from "./components/SaveToLibraryDrawer";
```

If still needed but deprecated:

```typescript
/**
 * @deprecated Use LibraryDrawer instead
 */
export { LibraryModal } from "./components/LibraryModal";
```

## Files to Investigate

- `packages/editor/src/index.ts`
- `packages/editor/src/components/LibraryModal.tsx` (if exists)
- `packages/editor/src/components/SaveToLibraryModal.tsx` (if exists)
- Usage in `apps/teacher/` and `apps/student/`

## Acceptance Criteria

- [ ] Audit all modal-related exports
- [ ] Document which components are actively used
- [ ] Remove unused exports and component files
- [ ] Or mark deprecated if transition period needed
- [ ] Update any import statements in consuming apps
- [ ] Verify no broken imports after cleanup
