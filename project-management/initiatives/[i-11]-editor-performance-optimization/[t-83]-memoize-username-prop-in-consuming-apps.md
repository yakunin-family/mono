---
status: todo
priority: high
description: Wrap userName construction in useMemo to prevent unnecessary re-renders
tags: [performance, teacher-app, student-app]
references: i-11
---

# Memoize userName Prop in Consuming Apps

Wrap the userName construction in `useMemo` in both teacher and student apps to prevent creating new string references on every render.

## Problem

Locations:

- `apps/teacher/src/routes/_protected/spaces.$id_.lesson.$lessonId.tsx:86-89`
- `apps/student/src/routes/_protected/spaces.$id_.lesson.$lessonId.tsx:34-37`

The userName prop is constructed inline without memoization:

```typescript
// Current (creates new string every render)
userName={
  user?.name ??
  user?.email?.split("@")[0] ??
  "Anonymous"
}
```

While strings are primitives and don't cause referential inequality issues by themselves, this pattern:

1. Runs the computation on every render
2. Creates intermediate array from `split()` on every render
3. Inconsistent with memoization best practices for props

## Solution

Wrap in useMemo in both apps:

```typescript
const userName = useMemo(() => {
  return user?.name ?? user?.email?.split("@")[0] ?? "Anonymous";
}, [user?.name, user?.email]);

// Then in JSX
<DocumentEditor
  userName={userName}
  // ...other props
/>
```

## Files to Modify

- `apps/teacher/src/routes/_protected/spaces.$id_.lesson.$lessonId.tsx`
- `apps/student/src/routes/_protected/spaces.$id_.lesson.$lessonId.tsx`

## Acceptance Criteria

- [ ] Add useMemo for userName in teacher app lesson route
- [ ] Add useMemo for userName in student app lesson route
- [ ] Verify user display name shows correctly in collaboration
- [ ] Ensure dependency array is correct
- [ ] No regressions in user identification during collaboration
