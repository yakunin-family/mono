---
status: todo
priority: high
description: Remove unnecessary waterfall in lesson editor route by enabling parallel fetching
tags: [performance, data-fetching]
---

# Fix Data Fetching Waterfall in Lesson Editor

Remove unnecessary waterfall in `apps/teacher/src/routes/_protected/spaces.$id_.lesson.$lessonId.tsx`. The `spaceQuery` has `enabled: !!lessonQuery.data` which creates a waterfall, but `spaceId` is available from route params.

## Problem

Currently the space query waits for the lesson query to complete before fetching:

```typescript
// Current (creates waterfall)
const spaceQuery = useQuery({
  ...convexQuery(api.spaces.get, { id: spaceId }),
  enabled: !!lessonQuery.data, // Unnecessary dependency
});
```

This means:

1. Lesson query starts
2. Wait for lesson to complete
3. Space query starts
4. Wait for space to complete

Total time: sequential (lesson time + space time)

## Solution

Since `spaceId` is available from route params, remove the `enabled` dependency:

```typescript
// Fixed (parallel fetching)
const spaceQuery = useQuery({
  ...convexQuery(api.spaces.get, { id: spaceId }),
  // No enabled flag - fetch immediately
});
```

Both queries run in parallel:

1. Lesson query starts
2. Space query starts (simultaneously)
3. Both complete independently

Total time: max(lesson time, space time)

## Acceptance Criteria

- [ ] Remove `enabled` dependency from spaceQuery
- [ ] Both lessonQuery and spaceQuery fetch in parallel
- [ ] No regression in functionality
- [ ] Verify loading states still work correctly
- [ ] Test that navigation from different entry points still works
