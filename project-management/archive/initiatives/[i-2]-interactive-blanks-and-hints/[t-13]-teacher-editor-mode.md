---
status: done
priority: high
description: Create interactive badges for inline editing of correct answers
tags: [ui, teacher, editing]
references: blocked-by:t-11
---

# Teacher Editor Mode - Inline Badge Editing

## Objective

Create the teacher editor view with interactive badges that allow inline editing of correct answers.

## Dependencies

- shadcn/ui badge component: `pnpx shadcn@latest add badge`

## Files Created

- `/packages/editor/src/components/blank/TeacherEditorBadge.tsx`

## Functionality

- Badge displaying correct answer (blue/purple pill)
- Click badge → transforms to inline input
- Type to edit answer
- Blur/Enter → saves, reverts to badge
- Escape → cancels, reverts without saving
- Hover shows alternatives in tooltip (if any)
- Hint icon adjacent (reuses HintTooltip)

## Acceptance Criteria

- [x] Teacher in editor mode sees badges instead of inputs
- [x] Badge displays current correct answer
- [x] Click badge to enter edit mode
- [x] Input auto-focuses and selects text
- [x] Enter key saves and returns to badge
- [x] Escape key cancels and reverts
- [x] Changed answer syncs via Yjs
- [x] Hover badge shows alternative answers
