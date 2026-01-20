---
status: done
priority: high
description: Create mode-aware list extensions (bullet, ordered, list items)
tags: [tiptap, extension]
references: blocked-by:t-27
---

# Create LessonList Extensions

## Description

Extend BulletList, OrderedList, and ListItem extensions to use contentEditable based on editor mode.

## Files to Create

- `packages/editor/src/extensions/lesson-mode/LessonBulletList.ts`
- `packages/editor/src/extensions/lesson-mode/LessonOrderedList.ts`
- `packages/editor/src/extensions/lesson-mode/LessonListItem.ts`

## Considerations

- List structure must remain intact
- Nesting should work correctly
- List markers should render properly

## Acceptance Criteria

- [ ] Bullet lists read-only in lesson modes
- [ ] Ordered lists read-only in lesson modes
- [ ] List items handle nested content
- [ ] Nested lists work correctly
