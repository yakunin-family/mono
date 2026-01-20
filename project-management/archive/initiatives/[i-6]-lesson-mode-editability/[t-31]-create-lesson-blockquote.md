---
status: done
priority: medium
description: Create mode-aware blockquote extension
tags: [tiptap, extension]
references: blocked-by:t-27
---

# Create LessonBlockquote Extension

## Description

Extend the default Blockquote extension to use contentEditable based on editor mode.

## Files to Create

- `packages/editor/src/extensions/lesson-mode/LessonBlockquote.ts`

## Acceptance Criteria

- [ ] Blockquotes read-only in lesson modes
- [ ] Blockquotes editable in teacher-editor mode
- [ ] Nested content handled correctly
- [ ] Preserves blockquote styling
