---
status: done
priority: high
description: Create student-facing input with real-time Yjs sync
tags: [ui, student]
references: blocked-by:t-8, blocked-by:t-9
---

# Student Mode - Interactive Input

## Objective

Create the student-facing input component that allows students to type answers with real-time Yjs synchronization.

## Files Created

- `/packages/editor/src/components/blank/StudentBlankInput.tsx`

## Functionality

- Text input field styled as fillable blank
- Controlled component (value + onChange)
- Auto-width: min 100px, max 300px, expand based on content
- Dashed underline styling (2px, blue/gray)
- Light blue tint on focus
- Inherit font from surrounding text

## Acceptance Criteria

- [x] Student sees input field where `[[blank]]` was
- [x] Input is inline with surrounding text
- [x] Student can type and see their answer
- [x] Input width expands as student types
- [x] Answer syncs in real-time via Yjs
- [x] Teacher sees student's answer update live
- [x] Focus styling works
