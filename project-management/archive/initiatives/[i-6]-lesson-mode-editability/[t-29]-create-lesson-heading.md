---
status: done
priority: high
description: Create mode-aware heading extension for all levels
tags: [tiptap, extension]
references: blocked-by:t-27
---

# Create LessonHeading Extension

## Description

Extend the default Heading extension to use contentEditable based on editor mode. Applies to all heading levels (h1-h6).

## Files to Create

- `packages/editor/src/extensions/lesson-mode/LessonHeading.ts`

## Acceptance Criteria

- [ ] All heading levels (h1-h6) supported
- [ ] Headings read-only in lesson modes
- [ ] Headings editable in teacher-editor mode
- [ ] Preserves heading level attributes
