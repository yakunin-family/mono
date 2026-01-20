---
status: done
priority: medium
description: Handle text node editability
tags: [tiptap, extension]
references: blocked-by:t-28
---

# Create LessonText Extension

## Description

Handle editability for text nodes. This may be handled implicitly by parent nodes, but evaluate if explicit handling is needed.

## Analysis Needed

- Text nodes are typically leaf nodes
- editability usually inherited from parent
- May not need custom handling

## Files to Create (if needed)

- `packages/editor/src/extensions/lesson-mode/LessonText.ts`

## Acceptance Criteria

- [ ] Text selection works in read-only mode
- [ ] Text copying works
- [ ] No editability issues with text
- [ ] Evaluate if explicit extension needed
