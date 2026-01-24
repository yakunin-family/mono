---
status: todo
priority: high
description: Optimize editor package performance based on Tiptap v3 and Vercel React best practices
tags: [performance, editor, tiptap, react]
---

# Editor Performance Optimization

## Vision

Implement comprehensive performance optimizations in the `packages/editor` package based on Tiptap v3 performance best practices and Vercel React guidelines. This initiative addresses critical re-render issues, inefficient patterns, and code organization improvements identified in a thorough assessment.

## Scope

### In Scope

- Toolbar re-render optimization (every keystroke issue)
- Editor transaction handling optimization
- useEffect consolidation
- Consuming apps integration improvements (teacher/student)
- Code deduplication and cleanup

### Out of Scope

- Feature additions to the editor
- Collaboration server performance
- Backend document storage optimization

## What's Already Done Well

- Editor is properly isolated in consuming apps
- Type safety with module augmentation (no `as any` casts)
- Split component pattern (DocumentEditor/DocumentEditorInternal)
- Clean extension organization
- Callback memoization in consuming apps
- `immediatelyRender: false` for SSR safety

## Tasks

### Critical Priority - Re-render Optimization

- [t-80] Optimize toolbar re-renders using useEditorState selectors
- [t-81] Add shouldRerenderOnTransaction option to useEditor

### High Priority - Consuming Apps

- [t-82] Consolidate multiple useEffect hooks for storage setup
- [t-83] Memoize userName prop in consuming apps

### Medium Priority - Code Quality

- [t-84] Deduplicate LibraryStorage interface definition
- [t-85] Audit and remove legacy modal exports
- [t-86] Replace window event with editor command for library modal

## Technical Context

The editor package uses:

- Tiptap v3.11.1 with React
- Hocuspocus for WebSocket collaboration
- Yjs for CRDT-based real-time sync
- React NodeViews for custom components

Reference: [Tiptap Performance Guide](https://tiptap.dev/docs/guides/performance)

## Impact Assessment

| Category               | Impact   | Tasks            |
| ---------------------- | -------- | ---------------- |
| Re-render optimization | CRITICAL | t-80, t-81       |
| Effect optimization    | HIGH     | t-82             |
| Props optimization     | HIGH     | t-83             |
| Code quality           | MEDIUM   | t-84, t-85, t-86 |

## Success Criteria

- Toolbar only re-renders when relevant state changes (not every keystroke)
- Editor component doesn't trigger React re-renders on every transaction
- Storage setup consolidated into single efficient effect
- No duplicate type definitions
- Clean exports with no unused legacy code
