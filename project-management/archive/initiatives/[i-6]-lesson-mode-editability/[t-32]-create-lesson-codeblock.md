---
status: done
priority: medium
description: Create mode-aware code block extension
tags: [tiptap, extension]
references: blocked-by:t-27
---

# Create LessonCodeBlock Extension

## Description

Extend the default CodeBlock extension to use contentEditable based on editor mode.

## Files to Create

- `packages/editor/src/extensions/lesson-mode/LessonCodeBlock.ts`

## Considerations

- Code blocks have special handling for whitespace
- Syntax highlighting should still work
- Copy functionality should work in read-only mode

## Acceptance Criteria

- [ ] Code blocks read-only in lesson modes
- [ ] Code blocks editable in teacher-editor mode
- [ ] Preserves code formatting
- [ ] Copy still works when read-only
