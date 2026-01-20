---
status: done
priority: high
description: Show student answers with validation indicators and peek feature
tags: [ui, teacher, validation]
references: blocked-by:t-10, blocked-by:t-11
---

# Teacher Lesson Mode - Validation & Peek

## Objective

Create the teacher lesson view that shows student answers with validation indicators and ability to peek at correct answers.

## Files Created

- `/packages/editor/src/utils/blankValidation.ts` - Validation logic
- `/packages/editor/src/components/blank/TeacherLessonBlank.tsx` - Component

## Functionality

- Read-only input showing student answer
- Validation icon: ✓ (green) / ✗ (red) / ○ (gray for empty)
- Peek button/icon to reveal correct answer in tooltip
- Hint icon (reuses HintTooltip)
- Case-insensitive, trimmed validation
- Accepts alternative answers

## Acceptance Criteria

- [x] Teachers in lesson mode see student answers in read-only inputs
- [x] Validation icon shows correctly
- [x] Validation updates in real-time as student types
- [x] Peek icon reveals correct answer in tooltip
- [x] Alternative answers accepted as correct
- [x] Validation is case-insensitive
- [x] Leading/trailing whitespace ignored
