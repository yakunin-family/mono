---
status: done
priority: high
description: Replace StarterKit nodes with lesson-mode versions
tags: [tiptap, integration]
references: blocked-by:t-28, blocked-by:t-29, blocked-by:t-30, blocked-by:t-31, blocked-by:t-32
---

# Register Lesson Mode Extensions

## Description

Configure StarterKit to disable default nodes and register the lesson-mode versions instead.

## Implementation

```typescript
StarterKit.configure({
  paragraph: false,
  heading: false,
  bulletList: false,
  orderedList: false,
  listItem: false,
  blockquote: false,
  codeBlock: false,
}),
LessonParagraph,
LessonHeading,
// ... etc
```

## Files to Modify

- `packages/editor/src/DocumentEditor.tsx`

## Files to Create

- `packages/editor/src/extensions/lesson-mode/index.ts` (barrel export)

## Acceptance Criteria

- [ ] StarterKit nodes disabled
- [ ] Lesson-mode nodes registered
- [ ] Extension order correct
- [ ] No conflicts or errors
