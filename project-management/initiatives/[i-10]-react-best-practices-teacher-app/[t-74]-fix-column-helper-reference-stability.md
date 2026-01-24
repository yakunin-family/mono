---
status: todo
priority: medium
description: Move columnHelper creation to module scope for stable reference
tags: [performance, re-renders]
---

# Fix columnHelper Reference Stability

In `apps/teacher/src/routes/_protected/_app/spaces.$id.tsx`, `columnHelper` is created inside the component on every render. Move it outside the component or to module scope for stable reference.

## Problem

```typescript
function SpaceDetailPage() {
  // Created on every render - new reference each time
  const columnHelper = createColumnHelper<LessonWithHomework>();

  const columns = useMemo(() => [
    columnHelper.accessor("title", { ... }),
    // ...
  ], [columnHelper]); // columnHelper changes every render!
}
```

Because `columnHelper` is created inside the component:

1. New reference on every render
2. `useMemo` dependency changes
3. `columns` array recreated
4. Table re-renders unnecessarily

## Solution

Move `columnHelper` to module scope:

```typescript
// Module scope - created once
const columnHelper = createColumnHelper<LessonWithHomework>();

function SpaceDetailPage() {
  const columns = useMemo(() => [
    columnHelper.accessor("title", { ... }),
    // ...
  ], []); // Empty deps - columnHelper is stable
}
```

Benefits:

- `columnHelper` created once at module load
- `columns` memoized correctly
- No unnecessary table re-renders

## Acceptance Criteria

- [ ] Move `createColumnHelper<LessonWithHomework>()` to module scope
- [ ] Update useMemo dependencies for columns array (should be empty or based on actual data dependencies)
- [ ] No functional changes to the table behavior
- [ ] Verify table renders correctly after changes
