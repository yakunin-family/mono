---
status: todo
priority: high
description: Implement React performance optimizations based on Vercel best practices in teacher app
tags: [performance, react, teacher-app]
---

# React Best Practices Improvements for Teacher App

## Vision

Implement React performance optimizations and best practices across the teacher application based on Vercel's React best practices guidelines. This initiative addresses issues found in a comprehensive code review covering data fetching, bundle size, re-render optimization, and error handling.

## Scope

### In Scope

- Eliminate data fetching waterfalls
- Bundle size optimization (lucide-react barrel file)
- Re-render optimization (stable references, memoization)
- Error boundary implementation
- Form migration to TanStack Form
- Consistent error handling patterns

### Out of Scope

- Student app optimizations (separate initiative)
- Backend performance
- Server-side rendering optimizations (SSR already handled by TanStack Start)

## Tasks

### High Priority - Data Fetching & Bundle Size

- [t-71] Fix data fetching waterfall in lesson editor
- [t-72] Add route loader to dashboard index page
- [t-73] Configure barrel file optimization for lucide-react

### Medium Priority - Re-render & Architecture

- [t-74] Fix columnHelper reference stability
- [t-75] Add error boundaries to critical components
- [t-76] Migrate forms to TanStack Form
- [t-77] Cache date formatters at module scope

### Low Priority - Polish

- [t-78] Add consistent error handling across queries
- [t-79] Consider lazy loading DocumentEditor

## Technical Context

The teacher app uses:

- TanStack Start (React SSR with file-based routing)
- TanStack Query with Convex
- TanStack Router
- Tailwind CSS v4
- @package/editor (Tiptap-based collaborative editor)

## Impact Categories (from Vercel guide)

| Category                 | Impact   | Tasks      |
| ------------------------ | -------- | ---------- |
| Eliminating waterfalls   | CRITICAL | t-71, t-72 |
| Bundle size optimization | CRITICAL | t-73, t-79 |
| Re-render optimization   | MEDIUM   | t-74, t-77 |
| Error handling           | MEDIUM   | t-75, t-78 |
| Architecture compliance  | MEDIUM   | t-76       |

## Success Criteria

- No unnecessary data fetching waterfalls
- Reduced initial bundle size (measurable improvement)
- Stable component references (no unnecessary re-renders)
- Error boundaries catch and display errors gracefully
- All forms use TanStack Form
- Consistent error handling across the application
